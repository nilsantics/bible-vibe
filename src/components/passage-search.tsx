'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronRight } from 'lucide-react'
import { BIBLE_BOOKS } from '@/lib/bible-data'

interface BookMeta {
  id: number
  name: string
  abbr: string
  testament: string
  chapters: number
  order: number
}

interface Result {
  book: BookMeta
  chapter: number | null // null = show book, select first chapter
}

function parseQuery(q: string): { bookQuery: string; chapter: number | null } {
  const trimmed = q.trim()
  // Match "John 3", "1 Cor 13", "Genesis", "gen 1"
  const match = trimmed.match(/^(.*?)\s+(\d+)$/)
  if (match) {
    return { bookQuery: match[1].trim(), chapter: parseInt(match[2], 10) }
  }
  // Maybe it's just a number — treat as chapter of current book
  const numOnly = trimmed.match(/^(\d+)$/)
  if (numOnly) {
    return { bookQuery: '', chapter: parseInt(numOnly[1], 10) }
  }
  return { bookQuery: trimmed, chapter: null }
}

function matchBooks(query: string): BookMeta[] {
  if (!query) return [...BIBLE_BOOKS]
  const q = query.toLowerCase().replace(/\s+/g, '')
  return BIBLE_BOOKS.filter((b) => {
    const name = b.name.toLowerCase().replace(/\s+/g, '')
    const abbr = b.abbr.toLowerCase().replace(/\s+/g, '')
    return name.startsWith(q) || abbr.startsWith(q) || name.includes(q)
  })
}

function getResults(query: string, currentBook: BookMeta): Result[] {
  if (!query.trim()) return []

  const { bookQuery, chapter } = parseQuery(query)

  // Just a number → chapter of current book
  if (bookQuery === '' && chapter !== null) {
    if (chapter >= 1 && chapter <= currentBook.chapters) {
      return [{ book: currentBook, chapter }]
    }
    return []
  }

  const books = matchBooks(bookQuery)
  if (!books.length) return []

  const results: Result[] = []

  if (chapter !== null) {
    // Book + chapter specified — show matching books at that chapter
    for (const b of books.slice(0, 5)) {
      if (chapter >= 1 && chapter <= b.chapters) {
        results.push({ book: b, chapter })
      }
    }
  } else {
    // Just book name — show first few chapters of each matching book
    for (const b of books.slice(0, 4)) {
      // If only one book matches, show its chapters
      if (books.length === 1) {
        const chCount = Math.min(b.chapters, 12)
        for (let ch = 1; ch <= chCount; ch++) {
          results.push({ book: b, chapter: ch })
        }
        if (b.chapters > 12) {
          results.push({ book: b, chapter: null }) // "more" placeholder
        }
      } else {
        results.push({ book: b, chapter: null })
      }
    }
  }

  return results.slice(0, 20)
}

export function PassageSearch({
  currentBook,
  currentChapter,
  translation,
}: {
  currentBook: BookMeta
  currentChapter: number
  translation: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = getResults(query, currentBook)

  const navigate = useCallback((result: Result) => {
    const ch = result.chapter ?? 1
    const slug = result.book.name.toLowerCase().replace(/\s+/g, '-')
    router.push(`/dashboard/reading/${slug}/${ch}?translation=${translation}`)
    setOpen(false)
    setQuery('')
  }, [router, translation])

  // Open with keyboard shortcut 'g'
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  useEffect(() => { setActiveIdx(0) }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIdx]) { navigate(results[activeIdx]) }
    if (e.key === 'Escape') setOpen(false)
  }

  // Auto-navigate if query resolves to exactly one result
  useEffect(() => {
    if (results.length === 1 && results[0].chapter !== null && query.trim().match(/\s+\d+$/)) {
      // Don't auto-navigate — let user press Enter
    }
  }, [results, query])

  return (
    <>
      {/* Trigger button — replaces the two old selects */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-muted/60 transition-colors text-sm font-semibold min-w-0"
        style={{ fontFamily: 'system-ui' }}
        title="Go to passage (g)"
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="hidden sm:inline text-foreground truncate">{currentBook.name}</span>
        <span className="sm:hidden text-foreground shrink-0">{currentBook.abbr}</span>
        <span className="text-muted-foreground font-normal shrink-0">·{currentChapter}</span>
        <kbd className="hidden sm:inline text-[10px] font-mono bg-muted border border-border rounded px-1 py-0.5 text-muted-foreground/60 ml-1">g</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={'Type a book or passage — e.g. \u201cJohn 3\u201d or \u201cRom 8\u201d'}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                style={{ fontFamily: 'system-ui' }}
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto">
              {!query.trim() ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                  Type a book name or passage — e.g. &ldquo;Genesis&rdquo;, &ldquo;John 3&rdquo;, &ldquo;Psalm 23&rdquo;
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="py-1">
                  {results.map((r, i) => (
                    <button
                      key={`${r.book.id}-${r.chapter}`}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        i === activeIdx ? 'bg-primary/8 text-foreground' : 'text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground/60 w-6 text-right font-mono shrink-0" style={{ fontFamily: 'system-ui' }}>
                          {r.book.testament === 'OT' || r.book.testament === 'Old' ? 'OT' : 'NT'}
                        </span>
                        <span className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                          {r.chapter !== null ? (
                            <>{r.book.name} <span className="text-muted-foreground font-normal">{r.chapter}</span></>
                          ) : (
                            <>{r.book.name} <span className="text-muted-foreground font-normal text-xs">· {r.book.chapters} chapters</span></>
                          )}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground/50" style={{ fontFamily: 'system-ui' }}>
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> go</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
