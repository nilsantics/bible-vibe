'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, ChevronRight } from 'lucide-react'
import { BIBLE_BOOKS } from '@/lib/bible-data'

const TOPIC_GROUPS = [
  {
    label: 'God & His Character',
    emoji: '✨',
    topics: [
      { label: 'Love of God',      query: 'God so loved',   color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Holiness',         query: 'holy LORD',      color: 'text-violet-600 dark:text-violet-400' },
      { label: 'Sovereignty',      query: 'LORD reigns',    color: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Mercy',            query: 'mercy endures',  color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Faithfulness',     query: 'faithful',       color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Omniscience',      query: 'God knows',      color: 'text-blue-600 dark:text-blue-400' },
    ],
  },
  {
    label: 'Salvation & Grace',
    emoji: '🕊️',
    topics: [
      { label: 'Grace',            query: 'grace',          color: 'text-sky-600 dark:text-sky-400' },
      { label: 'Salvation',        query: 'saved',          color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Forgiveness',      query: 'forgiven',       color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Redemption',       query: 'redeemed',       color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Justification',    query: 'justified',      color: 'text-violet-600 dark:text-violet-400' },
      { label: 'Born Again',       query: 'born again',     color: 'text-green-600 dark:text-green-400' },
    ],
  },
  {
    label: 'Faith & Trust',
    emoji: '⚓',
    topics: [
      { label: 'Faith',            query: 'faith',          color: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Trust in God',     query: 'trust in the LORD', color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Hope',             query: 'hope',           color: 'text-sky-600 dark:text-sky-400' },
      { label: 'Fear Not',         query: 'fear not',       color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Doubt',            query: 'doubt',          color: 'text-slate-600 dark:text-slate-400' },
      { label: 'Believing',        query: 'believes',       color: 'text-amber-600 dark:text-amber-400' },
    ],
  },
  {
    label: 'Prayer & Worship',
    emoji: '🙏',
    topics: [
      { label: 'Prayer',           query: 'pray',           color: 'text-violet-600 dark:text-violet-400' },
      { label: 'Praise',           query: 'praise',         color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Worship',          query: 'worship',        color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Thanksgiving',     query: 'give thanks',    color: 'text-orange-600 dark:text-orange-400' },
      { label: 'Singing',          query: 'sing to the LORD', color: 'text-pink-600 dark:text-pink-400' },
      { label: 'Fasting',          query: 'fasted',         color: 'text-slate-600 dark:text-slate-400' },
    ],
  },
  {
    label: 'Christian Life',
    emoji: '🌱',
    topics: [
      { label: 'Love one another', query: 'love one another', color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Obedience',        query: 'obey',           color: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Holiness',         query: 'be holy',        color: 'text-violet-600 dark:text-violet-400' },
      { label: 'Humility',         query: 'humble',         color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Serving others',   query: 'serve',          color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Generosity',       query: 'give',           color: 'text-green-600 dark:text-green-400' },
      { label: 'Patience',         query: 'patient',        color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Forgiveness',      query: 'forgive',        color: 'text-pink-600 dark:text-pink-400' },
    ],
  },
  {
    label: 'Emotions & Struggles',
    emoji: '💧',
    topics: [
      { label: 'Peace',            query: 'peace',          color: 'text-sky-600 dark:text-sky-400' },
      { label: 'Anxiety & Worry',  query: 'anxious',        color: 'text-slate-600 dark:text-slate-400' },
      { label: 'Grief',            query: 'mourn',          color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Joy',              query: 'rejoice',        color: 'text-yellow-600 dark:text-yellow-400' },
      { label: 'Loneliness',       query: 'alone',          color: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Suffering',        query: 'suffering',      color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Anger',            query: 'anger',          color: 'text-orange-600 dark:text-orange-400' },
      { label: 'Comfort',          query: 'comfort',        color: 'text-emerald-600 dark:text-emerald-400' },
    ],
  },
  {
    label: 'Promises of God',
    emoji: '🌈',
    topics: [
      { label: 'Eternal Life',     query: 'eternal life',   color: 'text-violet-600 dark:text-violet-400' },
      { label: 'Rest',             query: 'rest',           color: 'text-sky-600 dark:text-sky-400' },
      { label: 'Provision',        query: 'provide',        color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Strength',         query: 'strength',       color: 'text-orange-600 dark:text-orange-400' },
      { label: 'Healing',          query: 'heal',           color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Protection',       query: 'shelter',        color: 'text-indigo-600 dark:text-indigo-400' },
    ],
  },
  {
    label: 'End Times',
    emoji: '⏳',
    topics: [
      { label: 'Second Coming',    query: 'coming of the Lord', color: 'text-violet-600 dark:text-violet-400' },
      { label: 'Resurrection',     query: 'resurrection',   color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Judgement',        query: 'judgment',       color: 'text-slate-600 dark:text-slate-400' },
      { label: 'Heaven',           query: 'kingdom of heaven', color: 'text-sky-600 dark:text-sky-400' },
      { label: 'New Creation',     query: 'new heaven',     color: 'text-emerald-600 dark:text-emerald-400' },
    ],
  },
]

interface Result {
  verse_id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
}

export default function TopicsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeQuery, setActiveQuery] = useState('')

  async function search(q: string) {
    setLoading(true)
    setActiveQuery(q)
    setResults(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=text&translation=WEB`)
      const data = await res.json()
      setResults(data.results ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Browse by Topic
        </h1>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
          Find Scripture grouped by theme, or search any topic.
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (query.trim()) search(query) }}
        className="flex gap-2 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search any topic — love, forgiveness, wisdom…"
            className="pl-9 h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontFamily: 'system-ui' }}
          />
        </div>
        <Button type="submit" className="h-10 px-5" disabled={loading || !query.trim()}>
          Search
        </Button>
      </form>

      {/* Results panel */}
      {(loading || results) && (
        <div className="mb-10">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                  <span className="text-primary font-semibold">{results.length}</span> verse{results.length !== 1 ? 's' : ''} on &ldquo;{activeQuery}&rdquo;
                </p>
                <button
                  onClick={() => { setResults(null); setActiveQuery('') }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  style={{ fontFamily: 'system-ui' }}
                >
                  Clear
                </button>
              </div>
              {results.slice(0, 30).map((r) => {
                const book = BIBLE_BOOKS.find((b) => b.id === r.book_id)
                if (!book) return null
                return (
                  <Link
                    key={r.verse_id}
                    href={`/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${r.chapter_number}#v${r.verse_number}`}
                  >
                    <div className="border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/20 transition-colors group">
                      <p className="text-xs font-semibold text-primary mb-1.5" style={{ fontFamily: 'system-ui' }}>
                        {book.name} {r.chapter_number}:{r.verse_number}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                        {r.text}
                      </p>
                    </div>
                  </Link>
                )
              })}
              {results.length > 30 && (
                <Link href={`/dashboard/search?q=${encodeURIComponent(activeQuery)}`}>
                  <div className="text-center py-4 text-sm text-primary hover:underline" style={{ fontFamily: 'system-ui' }}>
                    See all {results.length} results in search →
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: 'system-ui' }}>
              No results for &ldquo;{activeQuery}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Topic groups */}
      {!results && !loading && (
        <div className="space-y-8">
          {TOPIC_GROUPS.map((group) => (
            <div key={group.label}>
              <h2 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
                <span>{group.emoji}</span>
                {group.label}
              </h2>
              <div className="flex flex-wrap gap-2">
                {group.topics.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => search(t.query)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-sm font-medium transition-colors ${t.color}`}
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {t.label}
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
