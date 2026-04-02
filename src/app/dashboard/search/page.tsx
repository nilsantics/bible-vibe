'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { BIBLE_BOOKS } from '@/lib/bible-data'

interface SearchResult {
  verse_id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
}

const TOPIC_SUGGESTIONS = [
  { label: 'Love',        query: 'love' },
  { label: 'Faith',       query: 'faith' },
  { label: 'Hope',        query: 'hope' },
  { label: 'Forgiveness', query: 'forgive' },
  { label: 'Prayer',      query: 'pray' },
  { label: 'Fear not',    query: 'fear not' },
  { label: 'Grace',       query: 'grace' },
  { label: 'Salvation',   query: 'saved' },
  { label: 'Peace',       query: 'peace' },
  { label: 'Wisdom',      query: 'wisdom' },
]

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const words = query.trim().split(/\s+/).filter((w) => w.length > 2)
  if (!words.length) return <>{text}</>

  const regex = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [bookFilter, setBookFilter] = useState<string>('all')
  const [testamentFilter, setTestamentFilter] = useState<string>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [lastQuery, setLastQuery] = useState('')

  const filteredBooks = BIBLE_BOOKS.filter((b) =>
    testamentFilter === 'all' ? true : b.testament === (testamentFilter === 'OT' ? 'Old' : 'New')
  )

  async function runSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    setLastQuery(q)

    try {
      let url = `/api/search?q=${encodeURIComponent(q)}&type=text&translation=WEB`
      if (bookFilter !== 'all') url += `&book_id=${bookFilter}`

      const res = await fetch(url)
      const data = await res.json()
      let filtered: SearchResult[] = data.results ?? []

      // Client-side testament filter (server doesn't support it yet)
      if (testamentFilter !== 'all') {
        const ids = new Set<number>(
          BIBLE_BOOKS.filter((b) => b.testament === (testamentFilter === 'OT' ? 'Old' : 'New')).map((b) => b.id as number)
        )
        filtered = filtered.filter((r) => ids.has(r.book_id))
      }

      setResults(filtered)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    runSearch(query)
  }

  function handleSuggestion(q: string) {
    setQuery(q)
    setBookFilter('all')
    setTestamentFilter('all')
    runSearch(q)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Search the Bible
        </h1>
        <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: 'system-ui' }}>
          Find any word or phrase across all 31,102 verses
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-2.5 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder='"God so loved the world" or: fear not'
              className="pl-9 h-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{ fontFamily: 'system-ui' }}
            />
          </div>
          <Button type="submit" className="h-10 px-5" disabled={loading || !query.trim()}>
            Search
          </Button>
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0" style={{ fontFamily: 'system-ui' }}>
            Filter by:
          </span>

          <Select
            value={testamentFilter}
            onValueChange={(v) => { if (v) { setTestamentFilter(v); setBookFilter('all') } }}
          >
            <SelectTrigger className="h-7 text-xs w-auto border-border px-2 gap-1 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All books</SelectItem>
              <SelectItem value="OT">Old Testament</SelectItem>
              <SelectItem value="NT">New Testament</SelectItem>
            </SelectContent>
          </Select>

          <Select value={bookFilter} onValueChange={(v) => { if (v) setBookFilter(v) }}>
            <SelectTrigger className="h-7 text-xs border-border px-2 gap-1 bg-transparent" style={{ width: bookFilter === 'all' ? '120px' : '150px' }}>
              <SelectValue placeholder="Specific book…" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">Any book</SelectItem>
              {filteredBooks.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(bookFilter !== 'all' || testamentFilter !== 'all') && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={() => { setBookFilter('all'); setTestamentFilter('all') }}
              style={{ fontFamily: 'system-ui' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </form>

      {/* States */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'system-ui' }}>
            <span className="font-semibold text-foreground">{results.length}</span>{' '}
            verse{results.length !== 1 ? 's' : ''} matching{' '}
            <span className="italic">&ldquo;{lastQuery}&rdquo;</span>
          </p>

          {results.map((result) => {
            const book = BIBLE_BOOKS.find((b) => b.id === result.book_id)
            if (!book) return null
            const href = `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${result.chapter_number}`
            return (
              <Link key={result.verse_id} href={href}>
                <div className="border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-primary" style={{ fontFamily: 'system-ui' }}>
                      {book.name} {result.chapter_number}:{result.verse_number}
                    </span>
                    <Badge variant="secondary" className="text-xs font-normal px-1.5 py-0">
                      {book.testament === 'Old' ? 'Old Testament' : 'New Testament'}
                    </Badge>
                    <span
                      className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      Open chapter →
                    </span>
                  </div>
                  <p className="bible-text text-sm leading-relaxed">
                    <HighlightedText text={result.text} query={lastQuery} />
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : searched ? (
        <div className="text-center py-16">
          <p className="font-medium mb-1" style={{ fontFamily: 'system-ui' }}>
            No results for &ldquo;{lastQuery}&rdquo;
          </p>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'system-ui' }}>
            Try different words or clear the book filter
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TOPIC_SUGGESTIONS.slice(0, 6).map(({ label, query: q }) => (
              <button
                key={label}
                className="text-sm px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                style={{ fontFamily: 'system-ui' }}
                onClick={() => handleSuggestion(q)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center mb-8">
            <Search className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="font-medium mb-1" style={{ fontFamily: 'system-ui' }}>
              Search by exact words or phrases
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Full-text search across all 31,102 verses.
              Use the filters above to narrow to a specific book or testament.
            </p>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3" style={{ fontFamily: 'system-ui' }}>
            Popular searches
          </p>
          <div className="flex flex-wrap gap-2">
            {TOPIC_SUGGESTIONS.map(({ label, query: q }) => (
              <button
                key={label}
                className="text-sm px-4 py-2 rounded-full border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                style={{ fontFamily: 'system-ui' }}
                onClick={() => handleSuggestion(q)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
