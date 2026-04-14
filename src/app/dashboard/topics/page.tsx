'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronRight, ArrowLeft, Zap, ExternalLink } from 'lucide-react'
import { BIBLE_BOOKS } from '@/lib/bible-data'

// ── Topic groups — goals, not keyword queries ─────────────────────────────────

const TOPIC_GROUPS = [
  {
    label: 'Virtues to Grow In',
    emoji: '🌱',
    topics: [
      { label: 'Patience',       goal: 'growing in patience and endurance through difficulty' },
      { label: 'Courage',        goal: 'finding courage and boldness when facing fear or opposition' },
      { label: 'Humility',       goal: 'cultivating humility and a servant heart' },
      { label: 'Generosity',     goal: 'growing in generosity and a giving spirit' },
      { label: 'Self-control',   goal: 'developing self-control and discipline over desires' },
      { label: 'Perseverance',   goal: 'pressing on and not giving up through trials' },
      { label: 'Compassion',     goal: 'growing in compassion and care for others' },
      { label: 'Integrity',      goal: 'living with integrity and honesty in all areas of life' },
    ],
  },
  {
    label: 'Struggles & Hard Seasons',
    emoji: '💧',
    topics: [
      { label: 'Anxiety & Fear',  goal: 'overcoming anxiety, fear, and worry' },
      { label: 'Grief & Loss',    goal: 'finding comfort and hope through grief and loss' },
      { label: 'Loneliness',      goal: 'finding belonging and presence of God in loneliness' },
      { label: 'Doubt',           goal: 'working through doubt and questions about faith' },
      { label: 'Shame & Guilt',   goal: 'finding freedom from shame, guilt, and condemnation' },
      { label: 'Suffering',       goal: 'making sense of suffering and finding God in pain' },
      { label: 'Anger',           goal: 'dealing with anger and bitterness in a godly way' },
      { label: 'Burnout',         goal: 'finding rest and renewal in exhaustion and burnout' },
    ],
  },
  {
    label: 'Relationships',
    emoji: '🤝',
    topics: [
      { label: 'Forgiveness',     goal: 'forgiving others who have hurt or wronged you' },
      { label: 'Conflict',        goal: 'navigating conflict and reconciliation with others' },
      { label: 'Love & Marriage', goal: 'what the Bible teaches about love and marriage' },
      { label: 'Friendship',      goal: 'building deep, godly friendships' },
      { label: 'Parenting',       goal: 'wisdom for raising children in faith' },
      { label: 'Leadership',      goal: 'what the Bible shows about servant leadership' },
    ],
  },
  {
    label: 'Faith & God',
    emoji: '✨',
    topics: [
      { label: 'Trusting God',    goal: 'learning to trust God in uncertainty and the unknown' },
      { label: 'Prayer',          goal: 'deepening your prayer life and communion with God' },
      { label: 'Identity in Christ', goal: 'understanding your identity and worth in Christ' },
      { label: "God's Presence",  goal: 'experiencing and recognizing the presence of God' },
      { label: 'Purpose & Calling', goal: 'discovering your purpose and calling from God' },
      { label: 'Spiritual Growth', goal: 'growing spiritually and becoming more like Christ' },
      { label: 'Worship',         goal: 'what true worship looks like and why it matters' },
      { label: 'The Holy Spirit', goal: 'understanding the role and work of the Holy Spirit' },
    ],
  },
  {
    label: 'Life Decisions',
    emoji: '🧭',
    topics: [
      { label: 'Wisdom',          goal: 'finding wisdom and discernment for life decisions' },
      { label: 'Work & Vocation', goal: 'a biblical view of work, career, and vocation' },
      { label: 'Money & Wealth',  goal: "the Bible's teaching on money, wealth, and contentment" },
      { label: 'Justice',         goal: 'what the Bible says about justice and caring for the vulnerable' },
      { label: 'Evangelism',      goal: 'sharing your faith and the call to make disciples' },
      { label: 'Sabbath & Rest',  goal: 'the importance of rest, sabbath, and stopping to be with God' },
    ],
  },
  {
    label: 'Promises & Hope',
    emoji: '🌈',
    topics: [
      { label: 'God\'s Faithfulness', goal: "God's faithfulness and track record of keeping promises" },
      { label: 'Hope',            goal: 'finding hope when circumstances feel hopeless' },
      { label: 'Provision',       goal: "trusting God's provision for your needs" },
      { label: 'Healing',         goal: 'what the Bible teaches about healing — body, soul, and spirit' },
      { label: 'Eternity',        goal: 'the hope of eternal life and what awaits believers' },
      { label: 'Redemption',      goal: 'the story of redemption and how God restores what is broken' },
    ],
  },
]

interface VerseResult {
  book: string
  chapter: number
  verse: number
  ref: string
  snippet: string
  why: string
  type?: 'narrative' | 'poetry' | 'teaching' | 'prophecy'
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  narrative: { label: 'Story',    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  poetry:    { label: 'Poetry',   color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  teaching:  { label: 'Teaching', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  prophecy:  { label: 'Prophecy', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
}

export default function TopicsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VerseResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeGoal, setActiveGoal] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function search(goal: string) {
    setLoading(true)
    setActiveGoal(goal)
    setResults(null)
    setError(null)
    try {
      const res = await fetch('/api/virtue-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setResults(data.results ?? [])
    } finally {
      setLoading(false)
    }
  }

  function getBookHref(result: VerseResult) {
    const book = BIBLE_BOOKS.find(
      (b) => b.name.toLowerCase() === result.book.toLowerCase()
    )
    if (!book) return '#'
    return `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${result.chapter}#v${result.verse}`
  }

  const showResults = loading || results !== null || error !== null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Verse Discovery
        </h1>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
          Find passages by what they teach — not just what words they use.
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (query.trim()) search(query.trim())
        }}
        className="flex gap-2 mb-8"
      >
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="What do you want to grow in, or what are you going through?"
            className="pl-9 h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontFamily: 'system-ui' }}
          />
        </div>
        <Button type="submit" className="h-10 px-5 gap-1.5" disabled={loading || !query.trim()}>
          <Sparkles className="w-3.5 h-3.5" />
          Find verses
        </Button>
      </form>

      {/* Results */}
      {showResults && (
        <div className="mb-10">
          {/* Back button */}
          <button
            onClick={() => { setResults(null); setActiveGoal(''); setError(null) }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
            style={{ fontFamily: 'system-ui' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to topics
          </button>

          {loading ? (
            <div className="space-y-4">
              <div className="h-4 w-48 bg-muted rounded animate-pulse mb-6" />
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border border-border rounded-xl p-4 space-y-2"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted/60 rounded animate-pulse mt-2" />
                  <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4" style={{ fontFamily: 'system-ui' }}>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    {error.includes('limit') ? 'Daily limit reached' : 'Sign in required'}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{error}</p>
                  {error.includes('limit') && (
                    <Link href="/dashboard/upgrade">
                      <Button size="sm" className="h-6 text-[11px] px-3 gap-1">
                        <Zap className="w-3 h-3" /> Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : results && results.length > 0 ? (
            <>
              {/* Result header */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-foreground mb-0.5" style={{ fontFamily: 'system-ui' }}>
                  {results.length} passages for &ldquo;{activeGoal}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                  Includes passages that embody the principle — even if they don&apos;t use the exact word.
                </p>
              </div>

              <div className="space-y-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group"
                  >
                    {/* Verse ref + navigate */}
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold text-primary"
                          style={{ fontFamily: 'system-ui' }}
                        >
                          {r.ref}
                        </span>
                        {r.type && TYPE_LABELS[r.type] && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_LABELS[r.type].color}`} style={{ fontFamily: 'system-ui' }}>
                            {TYPE_LABELS[r.type].label}
                          </span>
                        )}
                      </div>
                      <Link href={getBookHref(r)}>
                        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                          Read in context
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>

                    <div className="px-4 py-3 space-y-2.5">
                      {/* Verse snippet */}
                      <p
                        className="text-sm leading-relaxed text-foreground"
                        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
                      >
                        &ldquo;{r.snippet}&rdquo;
                      </p>

                      {/* Why this passage */}
                      <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <p
                          className="text-xs text-muted-foreground leading-relaxed"
                          style={{ fontFamily: 'system-ui' }}
                        >
                          {r.why}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Try another */}
              <p
                className="text-center text-xs text-muted-foreground mt-6"
                style={{ fontFamily: 'system-ui' }}
              >
                Not what you were looking for?{' '}
                <button
                  onClick={() => search(activeGoal)}
                  className="text-primary hover:underline"
                >
                  Try again
                </button>{' '}
                or{' '}
                <button
                  onClick={() => { setResults(null); setActiveGoal(''); setError(null) }}
                  className="text-primary hover:underline"
                >
                  search something else
                </button>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: 'system-ui' }}>
              No results found. Try rephrasing your goal.
            </p>
          )}
        </div>
      )}

      {/* Topic groups */}
      {!showResults && (
        <div className="space-y-8">
          {TOPIC_GROUPS.map((group) => (
            <div key={group.label}>
              <h2
                className="flex items-center gap-2 text-sm font-semibold mb-3"
                style={{ fontFamily: 'system-ui' }}
              >
                <span>{group.emoji}</span>
                {group.label}
              </h2>
              <div className="flex flex-wrap gap-2">
                {group.topics.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => search(t.goal)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-sm font-medium transition-colors text-foreground"
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
