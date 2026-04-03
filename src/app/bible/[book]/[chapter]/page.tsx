import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBookByName, BIBLE_BOOKS } from '@/lib/bible-data'
import { fetchBSBChapter } from '@/lib/bsb'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommentaryRenderer } from '@/components/commentary-renderer'

interface PageProps {
  params: Promise<{ book: string; chapter: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params
  const bookMeta = getBookByName(bookSlug)
  if (!bookMeta) return {}
  const chapter = parseInt(chapterStr, 10)
  const title = `${bookMeta.name} ${chapter} — Bible Study | Kairos`
  const description = `Read ${bookMeta.name} chapter ${chapter} (BSB) with cross-references, commentary, and original language insights. Free Bible study tool.`
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', siteName: 'Kairos' },
    alternates: {
      canonical: `https://studykairos.app/bible/${bookSlug}/${chapter}`,
    },
  }
}

export default async function PublicChapterPage({ params }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params
  const bookMeta = getBookByName(bookSlug)
  if (!bookMeta) notFound()

  const chapter = parseInt(chapterStr, 10)
  if (isNaN(chapter) || chapter < 1 || chapter > bookMeta.chapters) notFound()

  // Fetch BSB (public domain)
  let verses: { verse_number: number; text: string }[] = []
  try {
    const raw = await fetchBSBChapter(bookMeta.id, chapter)
    verses = raw.map((v) => ({ verse_number: v.verse_number, text: v.text }))
  } catch {
    verses = []
  }

  // Fetch cached commentary (no generation for anonymous)
  let commentary: string | null = null
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('commentaries')
      .select('content')
      .eq('source', 'ai')
      .eq('book_id', bookMeta.id)
      .eq('chapter', chapter)
      .single()
    commentary = data?.content ?? null
  } catch {
    commentary = null
  }

  const prevChapter = chapter > 1 ? chapter - 1 : null
  const nextChapter = chapter < bookMeta.chapters ? chapter + 1 : null
  const prevBook = chapter === 1 ? BIBLE_BOOKS.find((b) => b.order === bookMeta.order - 1) : null
  const nextBook = chapter === bookMeta.chapters ? BIBLE_BOOKS.find((b) => b.order === bookMeta.order + 1) : null

  const prevHref = prevChapter
    ? `/bible/${bookSlug}/${prevChapter}`
    : prevBook ? `/bible/${prevBook.name.toLowerCase().replace(/\s+/g, '-')}/${prevBook.chapters}` : null
  const nextHref = nextChapter
    ? `/bible/${bookSlug}/${nextChapter}`
    : nextBook ? `/bible/${nextBook.name.toLowerCase().replace(/\s+/g, '-')}/1` : null

  const readerHref = `/dashboard/reading/${bookSlug}/${chapter}`

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-13 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-sm border border-primary/60 flex items-center justify-center text-primary font-bold text-base bg-primary/5"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              K
            </div>
            <span className="font-semibold hidden sm:inline text-foreground/80" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', letterSpacing: '0.08em' }}>
              KAIROS
            </span>
          </Link>

          {/* Chapter nav */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {prevHref && (
              <Link href={prevHref}>
                <Button variant="ghost" size="icon" className="w-7 h-7"><ChevronLeft className="w-3.5 h-3.5" /></Button>
              </Link>
            )}
            <span className="px-1 font-medium text-foreground">{bookMeta.name} {chapter}</span>
            {nextHref && (
              <Link href={nextHref}>
                <Button variant="ghost" size="icon" className="w-7 h-7"><ChevronRight className="w-3.5 h-3.5" /></Button>
              </Link>
            )}
          </div>

          <Link href={readerHref}>
            <Button size="sm" className="gap-1.5 shrink-0 text-xs">
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Study in Kairos</span>
              <span className="sm:hidden">Study</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Signup CTA banner */}
      <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5">
        <p className="text-center text-xs text-muted-foreground max-w-3xl mx-auto" style={{ fontFamily: 'system-ui' }}>
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">Create a free account</Link>
          {' '}to highlight verses, take notes, ask Ezra AI questions, and track your reading.
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Chapter header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            {bookMeta.name}
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
            Chapter {chapter} · Berean Standard Bible
          </p>
        </div>

        {/* Bible text */}
        {verses.length > 0 ? (
          <div className="bible-text text-base leading-8 text-foreground/90 mb-16" style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: '1.05rem' }}>
            {verses.map((v) => (
              <span key={v.verse_number}>
                <sup className="text-[11px] text-primary/60 font-mono mr-1 not-italic">{v.verse_number}</sup>
                {v.text}{' '}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12" style={{ fontFamily: 'system-ui' }}>
            Could not load chapter text.
          </p>
        )}

        {/* Commentary (only if cached) */}
        {commentary && (
          <div className="border-t border-border pt-10 mb-16">
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {bookMeta.name} {chapter} — Commentary
            </h2>
            <CommentaryRenderer content={commentary} />
            <p className="text-xs text-muted-foreground mt-6 border-t border-border pt-4" style={{ fontFamily: 'system-ui' }}>
              Commentary generated by Ezra AI. For personal study use.{' '}
              <Link href={readerHref} className="text-primary hover:underline">
                Open the full study experience →
              </Link>
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="border border-border rounded-2xl p-6 text-center space-y-4 bg-secondary/30">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Go deeper with Kairos
            </h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Tap any verse to see 430,000 cross-references, Hebrew &amp; Greek word meanings, AI commentary, and more.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/auth/signup">
              <Button className="gap-1.5 w-full sm:w-auto">
                Start free <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href={readerHref}>
              <Button variant="outline" className="w-full sm:w-auto">
                Open in reader
              </Button>
            </Link>
          </div>
        </div>

        {/* Chapter nav footer */}
        <div className="flex items-center justify-between mt-10 pt-8 border-t border-border">
          {prevHref ? (
            <Link href={prevHref}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                {prevChapter ? `${bookMeta.name} ${prevChapter}` : `${prevBook?.name} ${prevBook?.chapters}`}
              </Button>
            </Link>
          ) : <div />}
          {nextHref ? (
            <Link href={nextHref}>
              <Button variant="outline" size="sm" className="gap-1.5">
                {nextChapter ? `${bookMeta.name} ${nextChapter}` : `${nextBook?.name} 1`}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : <div />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-xs text-muted-foreground/50" style={{ fontFamily: 'system-ui' }}>
          BSB © 2016–2024 Bible Hub. Used with permission. · {' '}
          <Link href="/" className="hover:text-muted-foreground">Kairos Bible Study</Link>
        </p>
      </footer>
    </div>
  )
}
