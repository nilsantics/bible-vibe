'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import {
  X, Sparkles, Pencil, Check, Bookmark, GitBranch, Search, ExternalLink, Copy, Share2, MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import type { HighlightColor } from '@/types'
import type { CrossRefResult } from '@/app/api/crossref/route'
import type { TaggedWord } from '@/app/api/strongs-verse/route'

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
  onOpenChat: () => void
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

type Tab = 'explain' | 'crossref' | 'words' | 'note'

const TABS = [
  { id: 'explain'  as Tab, label: 'Explain',   shortLabel: 'Explain',  icon: Sparkles  },
  { id: 'crossref' as Tab, label: 'Cross-refs', shortLabel: 'Refs',    icon: GitBranch },
  { id: 'words'    as Tab, label: "Strong's",  shortLabel: "Strong's", icon: Search    },
  { id: 'note'     as Tab, label: 'My Note',   shortLabel: 'Note',     icon: Pencil    },
] as const

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
  onOpenChat,
  anchor,
  isAuthenticated,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('explain')
  const [explainTriggered, setExplainTriggered] = useState(false)
  const [noteText, setNoteText] = useState(currentNote)
  const [noteSaved, setNoteSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [crossRefs, setCrossRefs] = useState<CrossRefResult[] | null>(null)
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false)
  const crossRefFetched = useRef(false)

  const [wordQuery, setWordQuery] = useState('')
  const [wordResults, setWordResults] = useState<StrongsEntry[]>([])
  const [wordLoading, setWordLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<StrongsEntry | null>(null)
  const [verseWords, setVerseWords] = useState<TaggedWord[]>([])
  const [verseWordsLoading, setVerseWordsLoading] = useState(false)
  const verseWordsFetched = useRef(false)
  const [selectedChip, setSelectedChip] = useState<TaggedWord | null>(null)
  const [chipEntry, setChipEntry] = useState<StrongsEntry | null>(null)
  const [chipEntryLoading, setChipEntryLoading] = useState(false)

  const popupRef = useRef<HTMLDivElement>(null)
  const verseRef = `${bookName} ${verse.chapter_number}:${verse.verse_number}`

  const { text: explanation, loading: loadingExplain } = useStreamingContent(
    explainTriggered, '/api/explain',
    { verseRef, verseText: verse.text, translation }
  )

  // Auto-load verse word tagging when Strong's tab opens
  useEffect(() => {
    if (activeTab !== 'words' || verseWordsFetched.current) return
    verseWordsFetched.current = true
    setVerseWordsLoading(true)
    const testament = verse.book_id <= 39 ? 'OT' : 'NT'
    const ref = `${bookName} ${verse.chapter_number}:${verse.verse_number}`
    fetch(`/api/strongs-verse?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(verse.text)}&testament=${testament}`)
      .then((r) => r.json())
      .then((d) => setVerseWords(d.words ?? []))
      .catch(() => setVerseWords([]))
      .finally(() => setVerseWordsLoading(false))
  }, [activeTab, verse, bookName])

  // Fetch full DB entry when a chip is clicked
  async function handleChipClick(tagged: TaggedWord) {
    setSelectedChip(tagged)
    setChipEntry(null)
    setChipEntryLoading(true)
    try {
      const r = await fetch(`/api/strongs?number=${encodeURIComponent(tagged.number)}`)
      const d = await r.json()
      setChipEntry(d.entry ?? null)
    } finally {
      setChipEntryLoading(false)
    }
  }

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

  // Close on outside click (desktop only — mobile has backdrop)
  useEffect(() => {
    if (isMobile) return
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose, isMobile])

  // Prevent body scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobile])

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

  function copyVerse() {
    const text = `"${verse.text}" — ${verseRef} (${translation})`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareVerse() {
    const text = `"${verse.text}" — ${verseRef} (${translation})`
    const url = `${window.location.origin}/dashboard/reading/${bookName.toLowerCase().replace(/\s+/g, '-')}/${verse.chapter_number}#v${verse.verse_number}`
    if (navigator.share) {
      navigator.share({ text, url, title: `${verseRef} — Kairos` })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const desktopStyle: React.CSSProperties = {
    position: 'absolute',
    top: anchor.y,
    left: Math.min(anchor.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 360),
    zIndex: 50,
    width: 340,
  }

  // ── MOBILE BOTTOM SHEET ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />

        {/* Sheet */}
        <div
          ref={popupRef}
          className="fixed bottom-16 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl border-t border-border flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(85dvh - 4rem)' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0">
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>{verseRef}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{translation}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={copyVerse} title="Copy verse">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={shareVerse} title="Share verse">
                <Share2 className="w-4 h-4" />
              </Button>
              {isAuthenticated && (
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onBookmark}>
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Verse text */}
          <div className="px-4 pb-3 shrink-0">
            <p className="bible-text text-sm leading-relaxed text-foreground">{verse.text}</p>
          </div>

          {/* Highlight row */}
          <div className="px-4 pb-3 flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Highlight:</span>
            {COLORS.map(({ color, hex }) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full transition-transform active:scale-95 ${
                  currentHighlight === color ? 'ring-2 ring-offset-1 ring-foreground/40 scale-110' : ''
                }`}
                style={{ backgroundColor: hex }}
                onClick={() => onHighlight(currentHighlight === color ? null : color)}
                aria-label={`${color} highlight`}
              />
            ))}
            {currentHighlight && (
              <button
                className="ml-auto text-xs text-muted-foreground"
                style={{ fontFamily: 'system-ui' }}
                onClick={() => onHighlight(null)}
              >
                Remove
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-t border-b border-border shrink-0">
            {TABS.map(({ id, shortLabel, icon: Icon }) => (
              <button
                key={id}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                  activeTab === id
                    ? 'text-primary border-b-2 border-primary font-medium bg-primary/5'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="w-4 h-4" />
                <span style={{ fontFamily: 'system-ui', fontSize: '10px' }}>{shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <TabContent
              activeTab={activeTab}
              explainTriggered={explainTriggered}
              setExplainTriggered={setExplainTriggered}
              explanation={explanation}
              loadingExplain={loadingExplain}

              crossRefs={crossRefs}
              loadingCrossRefs={loadingCrossRefs}
              onClose={onClose}
              onOpenChat={onOpenChat}
              wordQuery={wordQuery}
              setWordQuery={setWordQuery}
              wordResults={wordResults}
              wordLoading={wordLoading}
              selectedEntry={selectedEntry}
              setSelectedEntry={setSelectedEntry}
              searchWord={searchWord}
              verseWords={verseWords}
              verseWordsLoading={verseWordsLoading}
              selectedChip={selectedChip}
              chipEntry={chipEntry}
              chipEntryLoading={chipEntryLoading}
              handleChipClick={handleChipClick}
              onClearChip={() => { setSelectedChip(null); setChipEntry(null) }}
              noteText={noteText}
              setNoteText={setNoteText}
              noteSaved={noteSaved}
              handleSaveNote={handleSaveNote}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </>
    )
  }

  // ── DESKTOP FLOATING POPUP ───────────────────────────────────────────────
  return (
    <div ref={popupRef} style={desktopStyle} className="max-w-[90vw]">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div>
            <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'system-ui' }}>{verseRef}</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{translation}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={copyVerse} title="Copy verse">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={shareVerse} title="Share verse">
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onBookmark}>
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
        </div>

        {/* Highlight colors */}
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border">
          <span className="text-xs text-muted-foreground mr-1" style={{ fontFamily: 'system-ui' }}>Highlight:</span>
          {COLORS.map(({ color, hex }) => (
            <button
              key={color}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                currentHighlight === color ? 'ring-2 ring-offset-1 ring-foreground/30 scale-110' : ''
              }`}
              style={{ backgroundColor: hex }}
              onClick={() => onHighlight(currentHighlight === color ? null : color)}
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
          {TABS.map(({ id, label, icon: Icon }) => (
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
          <TabContent
            activeTab={activeTab}
            explainTriggered={explainTriggered}
            setExplainTriggered={setExplainTriggered}
            explanation={explanation}
            loadingExplain={loadingExplain}
            crossRefs={crossRefs}
            loadingCrossRefs={loadingCrossRefs}
            onClose={onClose}
            onOpenChat={onOpenChat}
            wordQuery={wordQuery}
            setWordQuery={setWordQuery}
            wordResults={wordResults}
            wordLoading={wordLoading}
            selectedEntry={selectedEntry}
            setSelectedEntry={setSelectedEntry}
            searchWord={searchWord}
            verseWords={verseWords}
            verseWordsLoading={verseWordsLoading}
            selectedChip={selectedChip}
            chipEntry={chipEntry}
            chipEntryLoading={chipEntryLoading}
            handleChipClick={handleChipClick}
            onClearChip={() => { setSelectedChip(null); setChipEntry(null) }}
            noteText={noteText}
            setNoteText={setNoteText}
            noteSaved={noteSaved}
            handleSaveNote={handleSaveNote}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  )
}

// ── Shared tab content ───────────────────────────────────────────────────────
interface TabContentProps {
  activeTab: Tab
  explainTriggered: boolean
  setExplainTriggered: (v: boolean) => void
  explanation: string
  loadingExplain: boolean
  crossRefs: CrossRefResult[] | null
  loadingCrossRefs: boolean
  onClose: () => void
  onOpenChat: () => void
  wordQuery: string
  setWordQuery: (v: string) => void
  wordResults: StrongsEntry[]
  wordLoading: boolean
  selectedEntry: StrongsEntry | null
  setSelectedEntry: (v: StrongsEntry | null) => void
  searchWord: (q: string) => void
  verseWords: TaggedWord[]
  verseWordsLoading: boolean
  selectedChip: TaggedWord | null
  chipEntry: StrongsEntry | null
  chipEntryLoading: boolean
  handleChipClick: (w: TaggedWord) => void
  onClearChip: () => void
  noteText: string
  setNoteText: (v: string) => void
  noteSaved: boolean
  handleSaveNote: () => void
  isAuthenticated: boolean
}

function TabContent({
  activeTab, explainTriggered, setExplainTriggered, explanation, loadingExplain,
  crossRefs, loadingCrossRefs, onClose, onOpenChat,
  wordQuery, setWordQuery, wordResults, wordLoading, selectedEntry, setSelectedEntry, searchWord,
  verseWords, verseWordsLoading, selectedChip, chipEntry, chipEntryLoading, handleChipClick, onClearChip,
  noteText, setNoteText, noteSaved, handleSaveNote, isAuthenticated,
}: TabContentProps) {
  return (
    <>
      {/* Explain */}
      {activeTab === 'explain' && (
        !explainTriggered ? (
          <div className="px-4 py-6 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'system-ui' }}>
              Plain meaning, historical context, and key word insights.
            </p>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setExplainTriggered(true)}>
              <Sparkles className="w-3.5 h-3.5" />
              Explain this verse
            </Button>
          </div>
        ) : (
          <>
            <StreamingContent text={explanation} loading={loadingExplain} />
            {!loadingExplain && explanation && (
              <div className="px-4 pb-4">
                <button
                  onClick={onOpenChat}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-medium text-primary"
                  style={{ fontFamily: 'system-ui' }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Got questions? Ask Ezra →
                </button>
              </div>
            )}
          </>
        )
      )}

      {/* Cross-refs */}
      {activeTab === 'crossref' && (
        <div className="px-4 py-3">
          {loadingCrossRefs ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
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
                  href={`/dashboard/reading/${ref.book_name.toLowerCase().replace(/\s+/g, '-')}/${ref.chapter}#v${ref.verse}`}
                  onClick={onClose}
                >
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors group">
                    <span className="text-xs font-medium" style={{ fontFamily: 'system-ui' }}>{ref.ref}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          ) : crossRefs !== null ? (
            <div className="py-6 text-center">
              <GitBranch className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>No cross-references found.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Strong's */}
      {activeTab === 'words' && (
        <div className="px-4 py-3 space-y-3">

          {/* ── Verse word chips ── */}
          {verseWordsLoading && (
            <div>
              <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'system-ui' }}>Tagging words…</p>
              <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-7 w-16 bg-muted rounded-full animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            </div>
          )}

          {!verseWordsLoading && verseWords.length > 0 && !selectedChip && (
            <div>
              <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'system-ui' }}>
                Tap a word to see its original meaning
              </p>
              <div className="flex flex-wrap gap-2">
                {verseWords.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(w)}
                    className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all text-left"
                  >
                    <span className="text-sm font-medium leading-tight" style={{ fontFamily: 'system-ui' }}>{w.word}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{w.original}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Selected chip detail ── */}
          {selectedChip && (
            <div className="space-y-2">
              <button
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={onClearChip}
                style={{ fontFamily: 'system-ui' }}
              >
                ← All words
              </button>

              {chipEntryLoading && (
                <div className="space-y-2 py-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${[90, 70, 80, 60][i]}%` }} />
                  ))}
                </div>
              )}

              {!chipEntryLoading && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
                  {/* Header: English + original */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5" style={{ fontFamily: 'system-ui' }}>
                        {selectedChip.word}
                      </p>
                      <p className="text-2xl font-medium leading-none">{selectedChip.original}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedChip.number}
                      </span>
                    </div>
                  </div>

                  {/* Transliteration + pronunciation */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm italic text-muted-foreground">{selectedChip.transliteration}</span>
                    {chipEntry?.pronunciation && (
                      <span className="text-xs text-muted-foreground">· {chipEntry.pronunciation}</span>
                    )}
                  </div>

                  {/* Brief (from Claude) always shown */}
                  <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>{selectedChip.brief}</p>

                  {/* Full definition from DB */}
                  {chipEntry?.definition && (
                    <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                      {chipEntry.definition}
                    </p>
                  )}
                  {chipEntry?.derivation && (
                    <p className="text-xs text-muted-foreground italic leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                      Origin: {chipEntry.derivation}
                    </p>
                  )}
                  {chipEntry?.kjv_usage && (
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                      KJV: <em>{chipEntry.kjv_usage}</em>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Divider + manual search ── */}
          {!selectedChip && (
            <>
              {verseWords.length > 0 && <div className="border-t border-border pt-2" />}
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                Search any word
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. grace, logos, shalom…"
                  className="h-8 text-xs"
                  value={wordQuery}
                  onChange={(e) => setWordQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchWord(wordQuery)}
                  style={{ fontFamily: 'system-ui' }}
                />
                <Button size="sm" className="h-8 px-2 shrink-0" onClick={() => searchWord(wordQuery)} disabled={wordLoading}>
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
                  {wordResults.map((entry) => (
                    <button
                      key={entry.number}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-primary">{entry.number}</span>
                        <span className="text-xs font-medium" style={{ fontFamily: 'system-ui' }}>{entry.word}</span>
                        {entry.transliteration && (
                          <span className="text-xs text-muted-foreground italic">({entry.transliteration})</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedEntry && (
                <div className="space-y-2">
                  <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedEntry(null)}>
                    ← Back
                  </button>
                  <StrongsEntryCard entry={selectedEntry} />
                </div>
              )}

              {!wordLoading && wordResults.length === 0 && wordQuery && (
                <p className="text-xs text-muted-foreground text-center py-2" style={{ fontFamily: 'system-ui' }}>
                  No results for &ldquo;{wordQuery}&rdquo;
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Note */}
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
            <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={handleSaveNote} disabled={!noteText.trim()}>
              {noteSaved ? <><Check className="w-3 h-3" /> Saved!</> : 'Save note'}
            </Button>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: 'system-ui' }}>
              <a href="/auth/login" className="text-primary hover:underline">Sign in</a> to save notes
            </p>
          )}
        </div>
      )}
    </>
  )
}

function StrongsEntryCard({ entry }: { entry: StrongsEntry }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3 space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-medium">{entry.word}</span>
        <span className="text-xs font-mono text-primary">{entry.number}</span>
        {entry.transliteration && <span className="text-xs text-muted-foreground italic">{entry.transliteration}</span>}
      </div>
      {entry.pronunciation && (
        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Pronounced: {entry.pronunciation}</p>
      )}
      <p className="text-xs leading-relaxed" style={{ fontFamily: 'system-ui' }}>{entry.definition}</p>
      {entry.derivation && (
        <p className="text-xs text-muted-foreground italic leading-relaxed" style={{ fontFamily: 'system-ui' }}>Origin: {entry.derivation}</p>
      )}
      {entry.kjv_usage && (
        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>KJV: <em>{entry.kjv_usage}</em></p>
      )}
    </div>
  )
}

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
          {loading && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse align-middle" />}
        </div>
      )}
    </div>
  )
}
