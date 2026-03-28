'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { getBookById } from '@/lib/bible-data'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerseInfo {
  id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
  books: { name: string; abbreviation: string }
}

interface MemCard {
  id: string
  verse_id: number
  difficulty: number
  interval: number
  repetitions: number
  due_date: string
  last_reviewed_at: string | null
  verses: VerseInfo
}

interface SearchVerse {
  verse_id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
}

// ─── Starter suggestions ─────────────────────────────────────────────────────

const STARTERS = [
  { label: 'John 3:16',    q: 'God so loved the world that he gave' },
  { label: 'Psalm 23:1',   q: 'The Lord is my shepherd I shall not want' },
  { label: 'Romans 8:28',  q: 'all things work together for good to those who love God' },
]

// ─── Quality button config ────────────────────────────────────────────────────

const QUALITY_BUTTONS = [
  { label: 'Blackout', quality: 0, className: 'bg-red-500 hover:bg-red-600 text-white',      emoji: '😶' },
  { label: 'Hard',     quality: 2, className: 'bg-orange-500 hover:bg-orange-600 text-white', emoji: '😓' },
  { label: 'Good',     quality: 3, className: 'bg-blue-500 hover:bg-blue-600 text-white',     emoji: '🙂' },
  { label: 'Easy',     quality: 4, className: 'bg-emerald-500 hover:bg-emerald-600 text-white',emoji: '😊' },
  { label: 'Perfect',  quality: 5, className: 'bg-violet-500 hover:bg-violet-600 text-white', emoji: '🌟' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verseRef(v: VerseInfo) {
  return `${v.books.name} ${v.chapter_number}:${v.verse_number}`
}

function searchVerseRef(v: SearchVerse) {
  const book = getBookById(v.book_id)
  return book
    ? `${book.name} ${v.chapter_number}:${v.verse_number}`
    : `Book ${v.book_id} ${v.chapter_number}:${v.verse_number}`
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemorizePage() {
  const [cards, setCards] = useState<MemCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [totalDue, setTotalDue] = useState(0)
  const [reviewed, setReviewed] = useState(0)

  // Add-verse section
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchVerse[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())

  // Load due cards
  const loadCards = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/memorize')
    if (res.status === 401) {
      setUnauthorized(true)
      setLoading(false)
      return
    }
    const json = await res.json()
    const fetched: MemCard[] = json.cards ?? []
    setCards(fetched)
    setTotalDue(fetched.length)
    setCurrentIdx(0)
    setFlipped(false)
    setDone(fetched.length === 0)
    setReviewed(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  // Handle quality rating
  async function handleQuality(quality: number) {
    const card = cards[currentIdx]
    if (!card || reviewing) return
    setReviewing(true)

    await fetch('/api/memorize', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, quality }),
    })

    const nextReviewed = reviewed + 1
    setReviewed(nextReviewed)
    const nextIdx = currentIdx + 1
    if (nextIdx >= cards.length) {
      setDone(true)
    } else {
      setCurrentIdx(nextIdx)
      setFlipped(false)
    }
    setReviewing(false)
  }

  // Search verses
  async function runSearch(q: string) {
    if (!q.trim()) return
    setSearching(true)
    setSearchResults([])
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(q.trim())}&type=text&translation=WEB`
    )
    const json = await res.json()
    setSearchResults((json.results ?? []).slice(0, 8))
    setSearching(false)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    await runSearch(searchQuery)
  }

  // Add verse to deck
  async function handleAdd(verse: SearchVerse) {
    setAddingId(verse.verse_id)
    const res = await fetch('/api/memorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verse_id: verse.verse_id }),
    })
    if (res.ok || res.status === 409) {
      setAddedIds((prev) => new Set([...prev, verse.verse_id]))
    }
    setAddingId(null)
    // Refresh so newly-added card appears if due today
    await loadCards()
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (unauthorized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'system-ui' }}>
          Sign in to memorize verses
        </h2>
        <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'system-ui' }}>
          Your memorization deck is saved to your account.
        </p>
        <a href="/auth/login">
          <Button>Sign in</Button>
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-4" style={{ fontFamily: 'system-ui' }}>
          Loading your deck…
        </p>
      </div>
    )
  }

  const currentCard = cards[currentIdx]
  const progressPct = totalDue > 0 ? Math.round((reviewed / totalDue) * 100) : 100

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          Memorize
        </h1>
        {totalDue > 0 && !done && (
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1"
            style={{ fontFamily: 'system-ui' }}
          >
            {totalDue - reviewed} card{totalDue - reviewed !== 1 ? 's' : ''} due today
          </Badge>
        )}
      </div>

      {/* ── Review section ────────────────────────────────────────────────── */}
      {!done && currentCard ? (
        <div className="space-y-5">
          {/* Progress bar */}
          <div className="space-y-1">
            <div
              className="flex justify-between text-xs text-muted-foreground"
              style={{ fontFamily: 'system-ui' }}
            >
              <span>{reviewed} reviewed</span>
              <span>{totalDue} total</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Flashcard */}
          <div
            className="cursor-pointer select-none"
            onClick={() => !reviewing && setFlipped((f) => !f)}
          >
            {!flipped ? (
              /* FRONT — reference */
              <Card className="min-h-[220px] flex flex-col items-center justify-center p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md transition-all">
                <p
                  className="text-xs uppercase tracking-widest text-muted-foreground mb-5"
                  style={{ fontFamily: 'system-ui' }}
                >
                  Reference
                </p>
                <p
                  className="text-3xl font-bold text-foreground"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {verseRef(currentCard.verses)}
                </p>
                <p
                  className="text-xs text-muted-foreground mt-6"
                  style={{ fontFamily: 'system-ui' }}
                >
                  Recall the verse from memory, then tap to reveal →
                </p>
              </Card>
            ) : (
              /* BACK — verse text */
              <Card className="min-h-[220px] flex flex-col items-center justify-center p-8 text-center border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/30 shadow-md transition-all">
                <p
                  className="text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-5"
                  style={{ fontFamily: 'system-ui' }}
                >
                  {verseRef(currentCard.verses)}
                </p>
                <p
                  className="text-lg leading-relaxed text-foreground"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {currentCard.verses.text}
                </p>
                <p
                  className="text-xs text-muted-foreground mt-5"
                  style={{ fontFamily: 'system-ui' }}
                >
                  How well did you remember it? Rate below.
                </p>
              </Card>
            )}
          </div>

          {/* Quality buttons — shown only after flip */}
          {flipped ? (
            <div className="space-y-2">
              <p
                className="text-center text-xs font-medium text-muted-foreground"
                style={{ fontFamily: 'system-ui' }}
              >
                How well did you remember it?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {QUALITY_BUTTONS.map(({ label, quality, className, emoji }) => (
                  <button
                    key={quality}
                    onClick={() => handleQuality(quality)}
                    disabled={reviewing}
                    className={`${className} rounded-xl py-3 px-1 text-center transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm`}
                  >
                    <span className="block text-xl">{emoji}</span>
                    <span
                      className="block text-xs font-semibold mt-1"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p
              className="text-center text-xs text-muted-foreground"
              style={{ fontFamily: 'system-ui' }}
            >
              Try to recall the verse from memory before revealing it
            </p>
          )}
        </div>
      ) : done ? (
        /* ── Completion screen ───────────────────────────────────────────── */
        <Card className="p-10 text-center space-y-3 border-emerald-500/20 bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/20">
          <p className="text-5xl">🎉</p>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {reviewed > 0 ? 'Session complete!' : 'You\'re all caught up!'}
          </h2>
          {reviewed > 0 ? (
            <p
              className="text-muted-foreground text-sm"
              style={{ fontFamily: 'system-ui' }}
            >
              You reviewed {reviewed} verse{reviewed !== 1 ? 's' : ''} today.
              Cards will return based on how well you remembered them.
            </p>
          ) : (
            <p
              className="text-muted-foreground text-sm"
              style={{ fontFamily: 'system-ui' }}
            >
              No cards are due right now. Add more verses below to grow your deck!
            </p>
          )}
          <Button
            variant="outline"
            onClick={loadCards}
            className="mt-2"
            style={{ fontFamily: 'system-ui' }}
          >
            Refresh
          </Button>
        </Card>
      ) : null}

      {/* ── Add verse section ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold" style={{ fontFamily: 'system-ui' }}>
          Add a verse to memorize
        </h2>

        {/* Starter suggestions — shown when deck is empty */}
        {totalDue === 0 && !searching && searchResults.length === 0 && (
          <div className="space-y-2">
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: 'system-ui' }}
            >
              Start with a classic:
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setSearchQuery(s.q)
                    runSearch(s.q)
                  }}
                  className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-muted transition-colors"
                  style={{ fontFamily: 'system-ui' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by words, e.g. "love one another"'
            className="flex-1"
            style={{ fontFamily: 'system-ui' }}
          />
          <Button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            style={{ fontFamily: 'system-ui' }}
          >
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </form>

        {/* Search results */}
        {searching && (
          <p
            className="text-sm text-muted-foreground text-center py-4"
            style={{ fontFamily: 'system-ui' }}
          >
            Searching…
          </p>
        )}

        {!searching && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((v) => {
              const isAdded = addedIds.has(v.verse_id)
              const isAdding = addingId === v.verse_id
              return (
                <Card key={v.verse_id} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold text-primary mb-1"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      {searchVerseRef(v)}
                    </p>
                    <p
                      className="text-sm leading-relaxed text-foreground line-clamp-3"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {v.text}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? 'secondary' : 'outline'}
                    disabled={isAdded || isAdding}
                    onClick={() => handleAdd(v)}
                    className="shrink-0"
                    style={{ fontFamily: 'system-ui' }}
                  >
                    {isAdding ? '…' : isAdded ? 'Added' : '+ Add'}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}

        {!searching && searchResults.length === 0 && searchQuery && (
          <p
            className="text-sm text-muted-foreground text-center py-4"
            style={{ fontFamily: 'system-ui' }}
          >
            No results found. Try different keywords.
          </p>
        )}
      </div>
    </div>
  )
}
