import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { Card } from '@/components/ui/card'
import { Highlighter, FileText, Bookmark, BookOpen } from 'lucide-react'

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow:  'bg-yellow-200/80 dark:bg-yellow-500/30',
  green:   'bg-green-200/80 dark:bg-green-500/30',
  blue:    'bg-blue-200/80 dark:bg-blue-500/30',
  pink:    'bg-pink-200/80 dark:bg-pink-500/30',
  purple:  'bg-purple-200/80 dark:bg-purple-500/30',
}

const COLOR_DOT: Record<string, string> = {
  yellow:  'bg-yellow-400',
  green:   'bg-green-400',
  blue:    'bg-blue-400',
  pink:    'bg-pink-400',
  purple:  'bg-purple-500',
}

function bookHref(bookId: number, chapter: number) {
  const b = BIBLE_BOOKS.find((b) => b.id === bookId)
  if (!b) return '/dashboard'
  return `/dashboard/reading/${b.name.toLowerCase().replace(/\s+/g, '-')}/${chapter}`
}

function bookRef(bookId: number, chapter: number, verse: number) {
  const b = BIBLE_BOOKS.find((b) => b.id === bookId)
  return b ? `${b.name} ${chapter}:${verse}` : `${chapter}:${verse}`
}

interface SearchParams { tab?: string }

export default async function StudyHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { tab = 'highlights' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  // Fetch all three in parallel
  const [hlRes, noteRes, bmRes] = await Promise.all([
    supabase
      .from('highlights')
      .select('id, color, verse_id, created_at, verses(book_id, chapter_number, verse_number, text)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('notes')
      .select('id, content, verse_id, created_at, verses(book_id, chapter_number, verse_number, text)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('bookmarks')
      .select('id, verse_id, created_at, verses(book_id, chapter_number, verse_number, text)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const highlights = hlRes.data ?? []
  const notes = noteRes.data ?? []
  const bookmarks = bmRes.data ?? []

  const tabs = [
    { key: 'highlights', label: 'Highlights', icon: Highlighter, count: highlights.length },
    { key: 'notes',      label: 'Notes',      icon: FileText,    count: notes.length },
    { key: 'bookmarks',  label: 'Bookmarks',  icon: Bookmark,    count: bookmarks.length },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
            Study History
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            Everything you&apos;ve highlighted, noted, and bookmarked
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border mb-6">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <Link
            key={key}
            href={`/dashboard/study-history?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontFamily: 'system-ui' }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Highlights tab */}
      {tab === 'highlights' && (
        <>
          {highlights.length === 0 ? (
            <EmptyState
              icon={Highlighter}
              title="No highlights yet"
              description="Select any verse in the Bible reader and pick a color to start highlighting."
            />
          ) : (
            <div className="space-y-2">
              {highlights.map((h) => {
                const v = Array.isArray(h.verses) ? h.verses[0] : h.verses
                if (!v) return null
                return (
                  <Link
                    key={h.id}
                    href={`${bookHref(v.book_id, v.chapter_number)}#v${v.verse_number}`}
                  >
                    <Card className="p-4 border-border hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${COLOR_DOT[h.color] ?? 'bg-yellow-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary mb-1.5" style={{ fontFamily: 'system-ui' }}>
                            {bookRef(v.book_id, v.chapter_number, v.verse_number)}
                          </p>
                          <p className={`text-base leading-relaxed italic px-3 py-1.5 rounded ${HIGHLIGHT_COLORS[h.color] ?? 'bg-yellow-200/80'}`}
                            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                            &ldquo;{v.text}&rdquo;
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Notes tab */}
      {tab === 'notes' && (
        <>
          {notes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="Tap any verse in the reader and use the Notes tab to write your thoughts."
            />
          ) : (
            <div className="space-y-3">
              {notes.map((n) => {
                const v = Array.isArray(n.verses) ? n.verses[0] : n.verses
                if (!v) return null
                return (
                  <Link
                    key={n.id}
                    href={`${bookHref(v.book_id, v.chapter_number)}#v${v.verse_number}`}
                  >
                    <Card className="p-4 border-border hover:border-primary/40 transition-colors">
                      <p className="text-sm font-semibold text-primary mb-1.5" style={{ fontFamily: 'system-ui' }}>
                        {bookRef(v.book_id, v.chapter_number, v.verse_number)}
                      </p>
                      <p className="text-sm text-muted-foreground italic mb-2.5 leading-relaxed"
                        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                        &ldquo;{v.text?.slice(0, 120)}{(v.text?.length ?? 0) > 120 ? '…' : ''}&rdquo;
                      </p>
                      <p className="text-base leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                        {n.content}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2" style={{ fontFamily: 'system-ui' }}>
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Bookmarks tab */}
      {tab === 'bookmarks' && (
        <>
          {bookmarks.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No bookmarks yet"
              description="Tap any verse and bookmark it to find it again quickly."
            />
          ) : (
            <div className="space-y-2">
              {bookmarks.map((b) => {
                const v = Array.isArray(b.verses) ? b.verses[0] : b.verses
                if (!v) return null
                return (
                  <Link
                    key={b.id}
                    href={`${bookHref(v.book_id, v.chapter_number)}#v${v.verse_number}`}
                  >
                    <Card className="p-4 border-border hover:border-primary/40 transition-colors flex items-center gap-3">
                      <Bookmark className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium" style={{ fontFamily: 'system-ui' }}>
                          {bookRef(v.book_id, v.chapter_number, v.verse_number)}
                        </p>
                        <p className="text-sm text-muted-foreground italic truncate"
                          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                          {v.text?.slice(0, 100)}…
                        </p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm mb-1" style={{ fontFamily: 'system-ui' }}>{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto" style={{ fontFamily: 'system-ui' }}>
        {description}
      </p>
      <Link
        href="/dashboard/reading/john/1"
        className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:underline"
        style={{ fontFamily: 'system-ui' }}
      >
        <BookOpen className="w-3.5 h-3.5" />
        Open Bible Reader
      </Link>
    </div>
  )
}