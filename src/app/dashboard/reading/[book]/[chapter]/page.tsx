import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BibleReader } from '@/components/bible-reader'
import { getBookByName, BIBLE_BOOKS } from '@/lib/bible-data'
import { fetchESVChapter } from '@/lib/esv'
import { fetchBSBChapter } from '@/lib/bsb'

interface PageProps {
  params: Promise<{ book: string; chapter: string }>
  searchParams: Promise<{ translation?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { book, chapter } = await params
  const bookMeta = getBookByName(book)
  if (!bookMeta) return {}
  const title = `${bookMeta.name} ${chapter} — Kairos`
  const description = `Read ${bookMeta.name} chapter ${chapter} with AI explanations, 430,000 cross-references, and Strong's Hebrew & Greek concordance.`
  const ogImage = `/api/og?ref=${encodeURIComponent(`${bookMeta.name} ${chapter}`)}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Kairos',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ReadingPage({ params, searchParams }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params
  const { translation = 'ESV' } = await searchParams

  const bookMeta = getBookByName(bookSlug)
  if (!bookMeta) notFound()

  const chapter = parseInt(chapterStr, 10)
  if (isNaN(chapter) || chapter < 1 || chapter > bookMeta.chapters) notFound()

  const supabase = await createClient()

  // ESV is served directly from the ESV API (not stored in Supabase)
  let verses: { id: number; book_id: number; chapter_number: number; verse_number: number; text: string }[] = []
  let esvError: string | undefined

  if (translation === 'ESV') {
    try {
      verses = await fetchESVChapter(bookMeta.name, chapter, bookMeta.id)
    } catch (e) {
      esvError = String(e)
      verses = []
    }
  } else if (translation === 'BSB') {
    try {
      verses = await fetchBSBChapter(bookMeta.id, chapter)
    } catch (e) {
      esvError = `Could not load BSB: ${String(e)}`
      verses = []
    }
  } else {
    const { data: translationRow } = await supabase
      .from('translations')
      .select('id')
      .eq('code', translation)
      .single()

    const { data } = await supabase
      .from('verses')
      .select('id, book_id, chapter_number, verse_number, text')
      .eq('book_id', bookMeta.id)
      .eq('chapter_number', chapter)
      .eq('translation_id', translationRow?.id ?? 1)
      .order('verse_number')

    verses = data ?? []
  }

  // Fetch user highlights/notes for this chapter (if logged in)
  const { data: { user } } = await supabase.auth.getUser()

  let highlights: Record<number, string> = {}
  let notes: Record<number, { id: string; content: string }> = {}

  if (user && verses && verses.length > 0) {
    const verseIds = verses.map((v) => v.id)

    const [hlResult, noteResult] = await Promise.all([
      supabase.from('highlights').select('verse_id, color').eq('user_id', user.id).in('verse_id', verseIds),
      supabase.from('notes').select('id, verse_id, content').eq('user_id', user.id).in('verse_id', verseIds),
    ])

    if (hlResult.data) {
      highlights = Object.fromEntries(hlResult.data.map((h) => [h.verse_id, h.color]))
    }
    if (noteResult.data) {
      notes = Object.fromEntries(noteResult.data.map((n) => [n.verse_id, { id: n.id, content: n.content }]))
    }
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null
  const nextChapter = chapter < bookMeta.chapters ? chapter + 1 : null

  // Find prev/next book for chapter boundary navigation
  const prevBook = chapter === 1
    ? BIBLE_BOOKS.find((b) => b.order === bookMeta.order - 1)
    : null
  const nextBook = chapter === bookMeta.chapters
    ? BIBLE_BOOKS.find((b) => b.order === bookMeta.order + 1)
    : null

  return (
    <BibleReader
      book={bookMeta}
      chapter={chapter}
      verses={verses ?? []}
      initialHighlights={highlights}
      initialNotes={notes}
      translation={translation}
      esvError={esvError}
      isAuthenticated={!!user}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      prevBook={prevBook ?? null}
      nextBook={nextBook ?? null}
    />
  )
}
