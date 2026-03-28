import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BibleReader } from '@/components/bible-reader'
import { getBookByName, BIBLE_BOOKS } from '@/lib/bible-data'

interface PageProps {
  params: Promise<{ book: string; chapter: string }>
  searchParams: Promise<{ translation?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { book, chapter } = await params
  const bookMeta = getBookByName(book)
  if (!bookMeta) return {}
  const title = `${bookMeta.name} ${chapter} — Bible Vibe`
  const description = `Read ${bookMeta.name} chapter ${chapter} with AI explanations, 430,000 cross-references, and Strong's Hebrew & Greek concordance.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function ReadingPage({ params, searchParams }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params
  const { translation = 'WEB' } = await searchParams

  const bookMeta = getBookByName(bookSlug)
  if (!bookMeta) notFound()

  const chapter = parseInt(chapterStr, 10)
  if (isNaN(chapter) || chapter < 1 || chapter > bookMeta.chapters) notFound()

  // Fetch verses server-side, filtered by translation
  const supabase = await createClient()

  const { data: translationRow } = await supabase
    .from('translations')
    .select('id')
    .eq('code', translation)
    .single()

  const { data: verses } = await supabase
    .from('verses')
    .select('id, book_id, chapter_number, verse_number, text')
    .eq('book_id', bookMeta.id)
    .eq('chapter_number', chapter)
    .eq('translation_id', translationRow?.id ?? 1)
    .order('verse_number')

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
      isAuthenticated={!!user}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      prevBook={prevBook ?? null}
      nextBook={nextBook ?? null}
    />
  )
}
