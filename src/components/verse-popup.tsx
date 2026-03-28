'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import {
  X, Sparkles, MapPin, Pencil, Check, Bookmark, GitBranch, Search, ExternalLink, Copy,
} from 'lucide-react'
import Link from 'next/link'
import type { HighlightColor } from '@/types'
import type { CrossRefResult } from '@/app/api/crossref/route'

interface Verse {
  id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
}

interface StrongsEntry {
  number: string
  word: string
  transliteration: string | null
  pronunciation: string | null
  definition: string
  derivation: string | null
  kjv_usage: string | null
  testament: string
}

interface Props {
  verse: Verse
  bookName: string
  translation: string
  currentHighlight: HighlightColor | null
  currentNote: string
  isBookmarked: boolean
  onHighlight: (color: HighlightColor | null) => void
  onSaveNote: (content: string) => void
  onBookmark: () => void
  onClose: () => void
  anchor: { x: number; y: number }
  isAuthenticated: boolean
}

const COLORS: { color: HighlightColor; hex: string }[] = [
  { color: 'yellow', hex: '#fef08a' },
  { color: 'green',  hex: '#86efac' },
  { color: 'blue',   hex: '#93c5fd' },
  { color: 'pink',   hex: '#f9a8d4' },
  { color: 'purple', hex: '#c4b5fd' },
]

type Tab = 'explain' | 'context' | 'crossref' | 'words' | 'note'

// Streaming hook for Claude API tabs
function useStreamingContent(
  trigger: boolean,
  url: string,
  body: object
): { text: string; loading: boolean } {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (!trigger || fetched.current) return
    fetched.current = true

    async function stream() {
      setLoading(true)
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok || !res.body) throw new Error('Stream failed')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setText(accumulated)
        }
      } catch {
        setText('Unable to load. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    stream()
  }, [trigger])

  return { text, loading }
}

export function VersePopup({
  verse,
  bookName,
  translation,
  currentHighlight,
  currentNote,
  isBookmarked,
  onHighlight,
  onSaveNote,
  onBookmark,
  onClose,
  anchor,
  isAuthenticated,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('explain')
  const [explainTriggered, setExplainTriggered] = useState(false)
  const [contextTriggered, setContextTriggered] = useState(false)
  const [noteText, setNoteText] = useState(currentNote)
  const [noteSaved, setNoteSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyVerse() {
    const text = `"${verse.text}" — ${verseRef} (${translation})`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Cross-refs from DB (auto-loads when tab is opened)
  const [crossRefs, setCrossRefs] = useState<CrossRefResult[] | null>(null)
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false)
  const crossRefFetched = useRef(false)

  // Word study (Strong's)
  const [wordQuery, setWordQuery] = useState('')
  const [wordResults, setWordResults] = useState<StrongsEntry[]>([])
  const [wordLoading, setWordLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<StrongsEntry | null>(null)

  const popupRef = useRef<HTMLDivElement>(null)
  const verseRef = `${bookName} ${verse.chapter_number}:${verse.verse_number}`

  const { text: explanation, loading: loadingExplain } = useStreamingContent(
    explainTriggered, '/api/explain',
    { verseRef, verseText: verse.text, translation }
  )

  const { text: aneContext, loading: loadingContext } = useStreamingContent(
    contextTriggered, '/api/context',
    { bookName, chapter: verse.chapter_number, verseText: verse.text }
  )

  // Auto-load cross-refs when that tab is opened
  useEffect(() => {
    if (activeTab !== 'crossref' || crossRefFetched.current) return
    crossRefFetched.current = true
    setLoadingCrossRefs(true)
    fetch(`/api/crossref?book_id=${verse.book_id}&chapter=${verse.chapter_number}&verse=${verse.verse_number}`)
      .then((r) => r.json())
      .then((d) => setCrossRefs(d.crossRefs ?? []))
      .catch(() => setCrossRefs([]))
      .finally(() => setLoadingCrossRefs(false))
  }, [activeTab, verse.book_id, verse.chapter_number, verse.verse_number])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Word study search
  async function searchWord(q: string) {
    if (!q.trim()) return
    setWordLoading(true)
    setSelectedEntry(null)
    try {
      const res = await fetch(`/api/strongs?word=${encodeURIComponent(q.trim())}`)
      const d = await res.json()
      setWordResults(d.entries ?? [])
    } finally {
      setWordLoading(false)
    }
  }

  async function handleSaveNote() {
    await onSaveNote(noteText)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    top: anchor.y,
    left: Math.min(anchor.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 360),
    zIndex: 50,
    width: 340,
  }

  return (
    <div ref={popupRef} style={popupStyle} className="max-w-[90vw]">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div>
            <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'system-ui' }}>
              {verseRef}
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              {translation}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={copyVerse}
              title="Copy verse"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={onBookmark}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Verse text */}
        <div className="px-4 py-3 border-b border-border bg-secondary/20">
          <p className="bible-text text-sm leading-relaxed text-foreground">{verse.text}</p>
          <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: 'system-ui' }}>
            Use the tabs below to explain, find cross-references, look up original words, or add a note.
          </p>
        </div>

        {/* Highlight colors */}
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border">
          <span className="text-xs text-muted-foreground mr-1" style={{ fontFamily: 'system-ui' }}>
            Highlight:
          </span>
          {COLORS.map(({ color, hex }) => (
            <button
              key={color}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                currentHighlight === color ? 'ring-2 ring-offset-1 ring-foreground/30 scale-110' : ''
              }`}
              style={{ backgroundColor: hex }}
              onClick={() => onHighlight(currentHighlight === color ? null : color)}
              title={`${color} highlight`}
              aria-label={`${color} highlight`}
            />
          ))}
          {currentHighlight && (
            <button
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              style={{ fontFamily: 'system-ui' }}
              onClick={() => onHighlight(null)}
            >
              Remove
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {([
            { id: 'explain'  as Tab, label: 'Explain',    icon: Sparkles },
            { id: 'context'  as Tab, label: 'History',    icon: MapPin },
            { id: 'crossref' as Tab, label: 'Cross-refs', icon: GitBranch },
            { id: 'words'    as Tab, label: "Strong's",   icon: Search },
            { id: 'note'     as Tab, label: 'My Note',    icon: Pencil },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs transition-colors shrink-0 ${
                activeTab === id
                  ? 'text-primary border-b-2 border-primary font-medium bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontFamily: 'system-ui' }}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-h-72 overflow-y-auto">

          {/* Explain tab */}
          {activeTab === 'explain' && (
            !explainTriggered ? (
              <div className="px-4 py-6 flex flex-col items-center gap-3">
                <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'system-ui' }}>
                  Get an explanation — plain meaning, historical context, and key word insights.
                </p>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => setExplainTriggered(true)}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Explain this verse
                </Button>
              </div>
            ) : (
              <StreamingContent text={explanation} loading={loadingExplain} />
            )
          )}

          {/* History tab */}
          {activeTab === 'context' && (
            !contextTriggered ? (
              <div className="px-4 py-6 flex flex-col items-center gap-3">
                <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'system-ui' }}>
                  Explore the Ancient Near Eastern setting, cultural customs, and what this meant to original readers.
                </p>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setContextTriggered(true)}>
                  <MapPin className="w-3.5 h-3.5" />
                  Load historical context
                </Button>
              </div>
            ) : (
              <StreamingContent text={aneContext} loading={loadingContext} />
            )
          )}

          {/* Cross-references tab — auto-loads from DB, no Claude */}
          {activeTab === 'crossref' && (
            <div className="px-4 py-3">
              {loadingCrossRefs ? (
                <div className="space-y-2 py-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" style={{ animationDelay: `${i*60}ms` }} />
                  ))}
                </div>
              ) : crossRefs && crossRefs.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'system-ui' }}>
                    {crossRefs.length} parallel passage{crossRefs.length !== 1 ? 's' : ''}
                  </p>
                  {crossRefs.map((ref, i) => (
                    <Link
                      key={i}
                      href={`/dashboard/reading/${ref.book_name.toLowerCase().replace(/\s+/g, '-')}/${ref.chapter}`}
                      onClick={onClose}
                    >
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors group">
                        <span className="text-xs font-medium" style={{ fontFamily: 'system-ui' }}>
                          {ref.ref}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : crossRefs !== null ? (
                <div className="py-6 text-center">
                  <GitBranch className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    No cross-references found for this verse.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Word Study tab — Strong's concordance */}
          {activeTab === 'words' && (
            <div className="px-4 py-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Type any word (e.g. grace, abide)…"
                  className="h-7 text-xs"
                  value={wordQuery}
                  onChange={(e) => setWordQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchWord(wordQuery)}
                  style={{ fontFamily: 'system-ui' }}
                />
                <Button
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={() => searchWord(wordQuery)}
                  disabled={wordLoading}
                >
                  <Search className="w-3 h-3" />
                </Button>
              </div>

              {wordLoading && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {!wordLoading && wordResults.length > 0 && !selectedEntry && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    {wordResults.length} result{wordResults.length !== 1 ? 's' : ''}
                  </p>
                  {wordResults.map((entry) => (
                    <button
                      key={entry.number}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-primary">{entry.number}</span>
                          <span className="text-xs font-medium" style={{ fontFamily: 'system-ui' }}>{entry.word}</span>
                          {entry.transliteration && (
                            <span className="text-xs text-muted-foreground italic">({entry.transliteration})</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.testament}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedEntry && (
                <div className="space-y-2">
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedEntry(null)}
                    style={{ fontFamily: 'system-ui' }}
                  >
                    ← Back to results
                  </button>
                  <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-medium">{selectedEntry.word}</span>
                      <span className="text-xs font-mono text-primary">{selectedEntry.number}</span>
                      {selectedEntry.transliteration && (
                        <span className="text-xs text-muted-foreground italic">
                          {selectedEntry.transliteration}
                        </span>
                      )}
                    </div>
                    {selectedEntry.pronunciation && (
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                        Pronounced: {selectedEntry.pronunciation}
                      </p>
                    )}
                    <p className="text-xs leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                      {selectedEntry.definition}
                    </p>
                    {selectedEntry.derivation && (
                      <p className="text-xs text-muted-foreground italic leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                        Origin: {selectedEntry.derivation}
                      </p>
                    )}
                    {selectedEntry.kjv_usage && (
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                        KJV renders as: <em>{selectedEntry.kjv_usage}</em>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!wordLoading && wordResults.length === 0 && wordQuery && (
                <p className="text-xs text-muted-foreground text-center py-4" style={{ fontFamily: 'system-ui' }}>
                  No results for &ldquo;{wordQuery}&rdquo;
                </p>
              )}

              {!wordQuery && !wordResults.length && (
                <div className="py-3 space-y-1">
                  <p className="text-xs font-medium text-center" style={{ fontFamily: 'system-ui' }}>
                    Strong&apos;s Hebrew &amp; Greek Concordance
                  </p>
                  <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'system-ui' }}>
                    Type any English word to see its original Hebrew (OT) or Greek (NT) meaning, pronunciation, and how it&apos;s used throughout Scripture.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Note tab */}
          {activeTab === 'note' && (
            <div className="px-4 py-3 space-y-2">
              <Textarea
                placeholder={isAuthenticated ? 'Write a note about this verse…' : 'Sign in to save notes'}
                className="text-xs min-h-24 resize-none border-0 bg-muted/40 focus:bg-muted/60 rounded-lg"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={!isAuthenticated}
              />
              {isAuthenticated && (
                <Button
                  size="sm"
                  className="w-full h-7 text-xs gap-1.5"
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                >
                  {noteSaved ? (
                    <><Check className="w-3 h-3" /> Saved!</>
                  ) : (
                    'Save note'
                  )}
                </Button>
              )}
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'system-ui' }}>
                  <a href="/auth/login" className="text-primary hover:underline">Sign in</a> to save notes
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Streaming text display with typing cursor while loading
function StreamingContent({ text, loading }: { text: string; loading: boolean }) {
  return (
    <div className="px-4 py-4">
      {!text && loading ? (
        <div className="space-y-2 py-1">
          {[100, 85, 92, 78, 88, 70].map((w, i) => (
            <div
              key={i}
              className="h-2.5 bg-muted rounded animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0 [&>h1]:text-sm [&>h1]:font-semibold [&>h1]:mt-4 [&>h1]:mb-1.5 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-1.5 [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>strong]:font-semibold [&>ul]:mt-2 [&>ul]:mb-3 [&>ul>li]:mb-1 text-xs">
          <ReactMarkdown>{text}</ReactMarkdown>
          {loading && (
            <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  )
}
