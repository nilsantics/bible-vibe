'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Columns2,
  X,
  Type,
  Languages,
} from 'lucide-react'
import { VersePopup } from '@/components/verse-popup'
import { ChatPanel } from '@/components/chat-panel'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { toast } from 'sonner'
import type { HighlightColor } from '@/types'

interface Verse {
  id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
}

interface BookMeta {
  id: number
  name: string
  abbr: string
  testament: string
  chapters: number
  order: number
}

interface Props {
  book: BookMeta
  chapter: number
  verses: Verse[]
  initialHighlights: Record<number, string>
  initialNotes: Record<number, { id: string; content: string }>
  translation: string
  isAuthenticated: boolean
  prevChapter: number | null
  nextChapter: number | null
  prevBook: BookMeta | null
  nextBook: BookMeta | null
  esvError?: string
}

interface TaggedWord {
  word: string
  original: string
  number: string
  transliteration: string
  brief: string
}

const TRANSLATIONS = [
  { code: 'ESV', name: 'Eng. Standard Version', recommended: true },
  { code: 'BSB', name: 'Berean Standard Bible' },
  { code: 'WEB', name: 'World English Bible' },
  { code: 'KJV', name: 'King James Version' },
]

export function BibleReader({
  book,
  chapter,
  verses,
  initialHighlights,
  initialNotes,
  translation,
  isAuthenticated,
  prevChapter,
  nextChapter,
  prevBook,
  nextBook,
  esvError,
}: Props) {
  const router = useRouter()
  const [highlights, setHighlights] = useState<Record<number, string>>(initialHighlights)
  const [notes, setNotes] = useState<Record<number, { id: string; content: string }>>(initialNotes)
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null)
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [compareTranslation, setCompareTranslation] = useState<string | null>(null)
  const [compareVerses, setCompareVerses] = useState<Verse[]>([])
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif')
  const readerRef = useRef<HTMLDivElement>(null)
  const [showVerseHint, setShowVerseHint] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Interlinear state
  const [interlinearOn, setInterlinearOn] = useState(false)
  const [interlinearWords, setInterlinearWords] = useState<Record<number, TaggedWord[]>>({})
  const [interlinearLoading, setInterlinearLoading] = useState(false)
  const [selectedInterlinearWord, setSelectedInterlinearWord] = useState<TaggedWord | null>(null)

  // Word count → reading time (~200 wpm)
  const wordCount = verses.reduce((n, v) => n + v.text.split(/\s+/).length, 0)
  const readingMinutes = Math.max(1, Math.round(wordCount / 200))

  // Persist font family preference
  useEffect(() => {
    const saved = localStorage.getItem('bv_font_family') as 'serif' | 'sans' | null
    if (saved) setFontFamily(saved)
  }, [])

  function cycleFontFamily() {
    setFontFamily((f) => {
      const next = f === 'serif' ? 'sans' : 'serif'
      localStorage.setItem('bv_font_family', next)
      return next
    })
  }

  // Save last reading position
  useEffect(() => {
    if (!isAuthenticated) return
    localStorage.setItem('bv_last_position', JSON.stringify({
      book: book.name.toLowerCase().replace(/\s+/g, '-'),
      chapter,
      translation,
    }))
  }, [book.name, chapter, translation, isAuthenticated])

  useEffect(() => {
    function onScroll() {
      const el = readerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const totalHeight = el.scrollHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      setScrollProgress(totalHeight > 0 ? Math.min(100, (scrolled / totalHeight) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const seen = localStorage.getItem('bv_verse_hint_seen')
    if (!seen) setShowVerseHint(true)
  }, [])

  function dismissVerseHint() {
    setShowVerseHint(false)
    localStorage.setItem('bv_verse_hint_seen', '1')
  }

  // ── Interlinear functions ────────────────────────────────────────────────────

  async function loadInterlinear() {
    if (interlinearLoading) return
    setInterlinearLoading(true)

    const cacheKey = `bv_interlinear_${book.id}_${chapter}_${translation}`

    try {
      // Check localStorage cache first
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const words: Record<number, TaggedWord[]> = JSON.parse(cached)
          setInterlinearWords(words)
          setInterlinearLoading(false)
          return
        } catch {
          localStorage.removeItem(cacheKey) // corrupted — clear and re-fetch
        }
      }

      const res = await fetch('/api/interlinear-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testament: book.testament,
          translation,
          // Pass verse texts directly — avoids DB lookup, works with ESV/BSB/WEB/KJV
          verses: verses.map((v) => ({ verse_number: v.verse_number, text: v.text })),
        }),
      })
      const data = await res.json()
      if (data.verses) {
        const words: Record<number, TaggedWord[]> = {}
        for (const [k, v] of Object.entries(data.verses)) {
          words[parseInt(k, 10)] = v as TaggedWord[]
        }
        setInterlinearWords(words)
        // Cache so future loads are instant
        try { localStorage.setItem(cacheKey, JSON.stringify(words)) } catch { /* quota exceeded — skip cache */ }
      } else if (data.error) {
        toast.error(`Interlinear: ${data.error}`)
      }
    } catch {
      toast.error('Could not load interlinear data')
    } finally {
      setInterlinearLoading(false)
    }
  }

  function toggleInterlinear() {
    if (interlinearOn) {
      setInterlinearOn(false)
      setSelectedInterlinearWord(null)
      return
    }
    setInterlinearOn(true)
    if (Object.keys(interlinearWords).length === 0) {
      loadInterlinear()
    }
  }

  // ── Data loading effects ─────────────────────────────────────────────────────

  // Load bookmarks for this chapter on mount
  useEffect(() => {
    if (!isAuthenticated) return
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks) {
          const ids = new Set<number>(data.bookmarks.map((b: { verses: { id: number } }) => b.verses?.id).filter(Boolean))
          setBookmarks(ids)
        }
      })
      .catch(() => {})
  }, [isAuthenticated])

  async function handleBookmark(verseId: number) {
    if (!isAuthenticated) { toast.info('Sign in to bookmark verses'); return }
    if (bookmarks.has(verseId)) {
      setBookmarks((prev) => { const n = new Set(prev); n.delete(verseId); return n })
      await fetch(`/api/bookmarks?verse_id=${verseId}`, { method: 'DELETE' })
      toast.success('Bookmark removed')
    } else {
      setBookmarks((prev) => new Set(prev).add(verseId))
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse_id: verseId }),
      })
      toast.success('Verse bookmarked!')
    }
  }

  // Award XP + track progress when chapter loads (once per chapter)
  useEffect(() => {
    if (!isAuthenticated) return
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: book.id, chapter_number: chapter }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.xpAwarded > 0) {
          toast.success(`+${data.xpAwarded} XP earned!`, { duration: 2000 })
        }
        if (data.newBadges?.length > 0) {
          for (const badge of data.newBadges) {
            toast.success(`Badge unlocked: ${badge}`, { duration: 4000 })
          }
        }
      })
      .catch(() => {})
  }, [book.id, chapter, isAuthenticated])

  // Fetch compare translation verses
  useEffect(() => {
    if (!compareTranslation) { setCompareVerses([]); return }
    fetch(`/api/verses?book=${book.id}&chapter=${chapter}&translation=${compareTranslation}`)
      .then((r) => r.json())
      .then((d) => setCompareVerses(d.verses ?? []))
      .catch(() => setCompareVerses([]))
  }, [compareTranslation, book.id, chapter])

  // ── Derived values ───────────────────────────────────────────────────────────

  const fontSizePx = { sm: '0.9rem', md: '1.05rem', lg: '1.2rem' }[fontSize]
  const fontFamilyCss = fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'
  const isOT = book.testament === 'OT' || book.testament === 'Old'

  // ── Event handlers ───────────────────────────────────────────────────────────

  function handleVerseClick(verse: Verse, event: React.MouseEvent) {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) return
    setSelectedVerse(verse)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setPopupAnchor({ x: rect.left, y: rect.bottom + window.scrollY + 8 })
    history.replaceState(null, '', `#v${verse.verse_number}`)
  }

  // Scroll to verse from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#v')) return
    const vNum = parseInt(hash.slice(2), 10)
    if (isNaN(vNum)) return
    setTimeout(() => {
      const el = document.getElementById(`verse-${vNum}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-primary/50', 'rounded')
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50', 'rounded'), 2500)
      }
    }, 300)
  }, [])

  function closePopup() {
    setSelectedVerse(null)
    setPopupAnchor(null)
  }

  async function handleHighlight(verseId: number, color: HighlightColor | null) {
    if (!isAuthenticated) { toast.info('Sign in to save highlights'); return }
    if (color === null) {
      setHighlights((prev) => { const next = { ...prev }; delete next[verseId]; return next })
      await fetch(`/api/highlights?verse_id=${verseId}`, { method: 'DELETE' })
    } else {
      setHighlights((prev) => ({ ...prev, [verseId]: color }))
      await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse_id: verseId, color }),
      })
    }
  }

  async function handleSaveNote(verseId: number, content: string) {
    if (!isAuthenticated) { toast.info('Sign in to save notes'); return }
    const existing = notes[verseId]
    if (existing) {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existing.id, content }),
      })
      const data = await res.json()
      if (data.note) setNotes((prev) => ({ ...prev, [verseId]: { id: data.note.id, content } }))
    } else {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse_id: verseId, content }),
      })
      const data = await res.json()
      if (data.note) setNotes((prev) => ({ ...prev, [verseId]: { id: data.note.id, content } }))
    }
    toast.success('Note saved')
  }

  function handleTranslationChange(newTranslation: string | null) {
    if (!newTranslation) return
    router.push(`/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${chapter}?translation=${newTranslation}`)
  }

  const prevHref = prevChapter
    ? `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${prevChapter}?translation=${translation}`
    : prevBook
    ? `/dashboard/reading/${prevBook.name.toLowerCase().replace(/\s+/g, '-')}/${prevBook.chapters}?translation=${translation}`
    : null

  const nextHref = nextChapter
    ? `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${nextChapter}?translation=${translation}`
    : nextBook
    ? `/dashboard/reading/${nextBook.name.toLowerCase().replace(/\s+/g, '-')}/1?translation=${translation}`
    : null

  // Eagerly prefetch adjacent chapters for instant navigation
  useEffect(() => {
    if (nextHref) router.prefetch(nextHref)
    if (prevHref) router.prefetch(prevHref)
  }, [nextHref, prevHref, router])

  // Touch swipe gestures
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    function onTouchStart(e: TouchEvent) {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - touchStartX
      const dy = e.changedTouches[0].clientY - touchStartY
      if (Math.abs(dx) < 60 || Math.abs(dy) > 80) return
      if (selectedVerse) return
      if (dx < 0 && nextHref) router.push(nextHref)
      if (dx > 0 && prevHref) router.push(prevHref)
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [nextHref, prevHref, selectedVerse, router])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'j' || e.key === 'ArrowRight') {
        if (nextHref) router.push(nextHref)
      } else if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (prevHref) router.push(prevHref)
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setChatOpen(true)
      } else if (e.key === 'Escape') {
        if (shortcutsOpen) setShortcutsOpen(false)
        else if (selectedVerse) closePopup()
        else {
          setSelectedInterlinearWord(null)
          setChatOpen(false)
        }
      } else if (e.key === '?' || e.key === 'F1') {
        e.preventDefault()
        setShortcutsOpen((o) => !o)
      } else if (e.key === 'f' || e.key === 'F') {
        setFontSize((s) => s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'sm')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextHref, prevHref, selectedVerse, shortcutsOpen, router])

  if (!verses || verses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-2">
        {translation === 'ESV' ? (
          <>
            <p className="text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Could not load ESV text.
            </p>
            {esvError && (
              <p className="text-sm text-destructive bg-muted px-2 py-1 rounded" style={{ fontFamily: 'monospace' }}>
                {esvError}
              </p>
            )}
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Make sure <code className="bg-muted px-1 rounded">ESV_API_KEY</code> is set in Vercel environment variables, then redeploy.
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Bible text not loaded yet. Run the seed script first.
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              <code className="bg-muted px-1 rounded">npx ts-node scripts/seed-bible.ts</code>
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Main reading area */}
      <div className={`flex-1 transition-all ${chatOpen ? 'sm:mr-80' : ''} ${chatOpen ? 'hidden sm:block' : ''}`}>

        {/* Reading toolbar */}
        <div className="sticky top-13 z-30 bg-background/95 backdrop-blur-sm border-b border-border" data-ui>
          {/* Scroll progress bar */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary/70 transition-all duration-100 ease-out" style={{ width: `${scrollProgress}%` }} />

          {/* Row 1: Book / Chapter navigation */}
          <div className="max-w-3xl mx-auto px-4 pt-2 pb-1 flex items-center gap-1">
            <Select
              value={book.name}
              onValueChange={(b) => {
                if (!b) return
                router.push(`/dashboard/reading/${b.toLowerCase().replace(/\s+/g, '-')}/1?translation=${translation}`)
              }}
            >
              <SelectTrigger className="h-8 text-sm border-0 bg-transparent font-semibold px-1 w-auto gap-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {BIBLE_BOOKS.map((b) => (
                  <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground text-sm">·</span>

            <Select
              value={String(chapter)}
              onValueChange={(ch) => router.push(`/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${ch}?translation=${translation}`)}
            >
              <SelectTrigger className="h-8 text-sm border-0 bg-transparent px-1 w-auto gap-1">
                <span className="text-muted-foreground text-xs mr-0.5">Ch</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
                  <SelectItem key={ch} value={String(ch)}>Chapter {ch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Tool controls */}
          <div className="max-w-3xl mx-auto px-4 pb-2 flex items-center gap-1 flex-wrap">
            {/* Translation */}
            <Select value={translation} onValueChange={handleTranslationChange}>
              <SelectTrigger className="h-7 border border-border rounded-lg px-2 text-xs font-semibold bg-transparent w-auto gap-1 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATIONS.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    <span className="font-semibold">{t.code}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{t.name}</span>
                    {'recommended' in t && t.recommended && (
                      <span className="ml-2 text-xs text-primary font-medium">Recommended</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Compare — desktop only */}
            <div className="hidden sm:flex items-center">
              {compareTranslation ? (
                <div className="flex items-center gap-1 border border-primary/40 bg-primary/5 rounded-lg px-2 h-7">
                  <Columns2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-xs font-medium text-primary" style={{ fontFamily: 'system-ui' }}>
                    {translation} · {compareTranslation}
                  </span>
                  <button className="ml-1 text-primary/60 hover:text-primary" onClick={() => setCompareTranslation(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Select value="none" onValueChange={(v) => v !== 'none' && setCompareTranslation(v)}>
                  <SelectTrigger className="h-7 border border-border rounded-lg px-2 text-xs text-muted-foreground bg-transparent gap-1 w-auto focus:ring-0">
                    <Columns2 className="w-3 h-3" />
                    <span style={{ fontFamily: 'system-ui' }}>Compare</span>
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSLATIONS.filter((t) => t.code !== translation).map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.code} — <span className="text-muted-foreground">{t.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Font size */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal"
              onClick={() => setFontSize((s) => s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'sm')}
              title="Change font size"
            >
              <Type className="w-3 h-3" />
              <span style={{ fontFamily: 'system-ui' }} className="hidden sm:inline">
                {fontSize === 'sm' ? 'Small' : fontSize === 'md' ? 'Medium' : 'Large'}
              </span>
            </Button>

            {/* Font family toggle */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal"
              onClick={cycleFontFamily}
              title="Toggle font style"
            >
              <span className="text-xs" style={{ fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui' }}>
                {fontFamily === 'serif' ? 'Serif' : 'Sans'}
              </span>
            </Button>

            {/* Interlinear toggle */}
            <Button
              variant={interlinearOn ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal"
              onClick={toggleInterlinear}
              title="Interlinear view — original Hebrew/Greek under each word"
              disabled={interlinearLoading}
            >
              <Languages className="w-3 h-3" />
              <span className="hidden sm:inline" style={{ fontFamily: 'system-ui' }}>
                {interlinearLoading ? 'Loading…' : 'Interlinear'}
              </span>
            </Button>

            {/* Quiz this chapter */}
            <Link
              href={`/dashboard/quiz?book=${encodeURIComponent(book.name)}&chapter=${chapter}`}
              title="Quiz yourself on this chapter"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1 font-normal"
              >
                <span style={{ fontFamily: 'system-ui' }}>Quiz</span>
              </Button>
            </Link>

            {/* Ask Ezra */}
            <Button
              variant={chatOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal ml-auto"
              onClick={() => setChatOpen((o) => !o)}
            >
              <MessageSquare className="w-3 h-3" />
              <span style={{ fontFamily: 'system-ui' }}>Ask Ezra</span>
            </Button>

            {/* Keyboard shortcuts — desktop only */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 px-0 text-xs text-muted-foreground font-mono hidden sm:flex"
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard shortcuts (?)"
            >
              ?
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts overlay */}
        {shortcutsOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShortcutsOpen(false)}>
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ fontFamily: 'system-ui' }}>Keyboard shortcuts</h2>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShortcutsOpen(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'j / →', desc: 'Next chapter' },
                  { key: 'k / ←', desc: 'Previous chapter' },
                  { key: '/', desc: 'Open Ezra chat' },
                  { key: 'f', desc: 'Cycle font size' },
                  { key: '?', desc: 'Show shortcuts' },
                  { key: 'Esc', desc: 'Close popup / chat' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{desc}</span>
                    <kbd className="text-xs bg-muted border border-border rounded px-2 py-0.5 font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center" style={{ fontFamily: 'system-ui' }}>
                Press <kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> to close
              </p>
            </div>
          </div>
        )}

        {/* Interlinear word detail popup */}
        {selectedInterlinearWord && (
          <div
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/20"
            onClick={() => setSelectedInterlinearWord(null)}
          >
            <div
              className="bg-card border border-border rounded-2xl shadow-xl p-5 w-full max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p
                    className="text-3xl font-bold leading-none"
                    dir={isOT ? 'rtl' : 'ltr'}
                    style={{ fontFamily: isOT ? 'serif' : 'system-ui' }}
                  >
                    {selectedInterlinearWord.original || '—'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 font-mono" style={{ fontFamily: 'system-ui' }}>
                    {selectedInterlinearWord.transliteration}
                  </p>
                </div>
                <button onClick={() => setSelectedInterlinearWord(null)} className="text-muted-foreground hover:text-foreground mt-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {selectedInterlinearWord.number && (
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${
                    selectedInterlinearWord.number.startsWith('H')
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {selectedInterlinearWord.number}
                  </span>
                )}
                <span className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                  {selectedInterlinearWord.word.replace(/[.,;:!?'"()[\]]/g, '')}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                {selectedInterlinearWord.brief}
              </p>
            </div>
          </div>
        )}

        {/* Bible text */}
        <div className="max-w-3xl mx-auto px-4 py-10 pb-32" ref={readerRef}>
          {/* Chapter header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Georgia, serif' }}>
              {book.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-base" style={{ fontFamily: 'system-ui' }}>
              Chapter {chapter}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1" style={{ fontFamily: 'system-ui' }}>
              ~{readingMinutes} min read · {verses.length} verses
            </p>
          </div>

          {/* Verse click hint */}
          {showVerseHint && (
            <div className="flex items-center justify-between gap-3 mb-6 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">👆</span>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                    Tap any verse to study it
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    Cross-references · Strong&apos;s Hebrew &amp; Greek · Explanations · Highlights · Notes
                  </p>
                </div>
              </div>
              <button onClick={dismissVerseHint} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Interlinear loading indicator */}
          {interlinearLoading && (
            <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading original {isOT ? 'Hebrew' : 'Greek'} words…
            </div>
          )}

          {/* ── INTERLINEAR VIEW ── */}
          {interlinearOn && Object.keys(interlinearWords).length > 0 ? (
            <div className="space-y-8">
              {verses.map((verse) => {
                const words = interlinearWords[verse.verse_number] ?? []
                const hlColor = highlights[verse.id]
                const hlClass = hlColor ? `hl-${hlColor}` : ''
                return (
                  <div
                    key={verse.id}
                    id={`verse-${verse.verse_number}`}
                    className={`${hlClass} transition-colors`}
                  >
                    <div className="flex gap-2 items-start">
                      {/* Verse number — click to open popup */}
                      <sup
                        className="verse-number shrink-0 mt-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setSelectedVerse(verse)
                          setPopupAnchor({ x: rect.left, y: rect.bottom + window.scrollY + 8 })
                          history.replaceState(null, '', `#v${verse.verse_number}`)
                        }}
                        title={`Tap to study ${book.name} ${chapter}:${verse.verse_number}`}
                      >
                        {verse.verse_number}
                      </sup>

                      {/* Word grid */}
                      <div className="flex flex-wrap gap-x-2 gap-y-2 leading-none">
                        {words.length > 0 ? words.map((w, i) => (
                          <button
                            key={i}
                            onClick={() => w.number ? setSelectedInterlinearWord(w) : undefined}
                            className={`flex flex-col items-center text-center rounded px-0.5 py-0.5 transition-colors ${
                              w.number ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'
                            }`}
                            title={w.number ? `${w.number} — ${w.brief}` : undefined}
                          >
                            <span style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss }}>
                              {w.word}
                            </span>
                            {w.transliteration && (
                              <span className="text-[9px] text-muted-foreground/60 font-mono leading-none mt-0.5">
                                {w.transliteration}
                              </span>
                            )}
                            {w.original && (
                              <span
                                className={`text-[11px] font-semibold leading-none mt-0.5 ${
                                  w.number?.startsWith('H')
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                                dir={isOT ? 'rtl' : 'ltr'}
                              >
                                {w.original}
                              </span>
                            )}
                          </button>
                        )) : (
                          // Fallback: no tagged words yet for this verse
                          <span style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss }}>
                            {verse.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          /* ── COMPARE VIEW ── */
          ) : compareTranslation && compareVerses.length > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                  {translation}
                </p>
                <div className="bible-text space-y-0" style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss }}>
                  {verses.map((verse) => {
                    const hlColor = highlights[verse.id]
                    const hasNote = !!notes[verse.id]
                    const hlClass = hlColor ? `hl-${hlColor}` : ''
                    return (
                      <span key={verse.id} className={`relative cursor-pointer rounded-sm transition-colors hover:bg-primary/8 ${hlClass} ${selectedVerse?.id === verse.id ? 'ring-1 ring-primary/30 rounded' : ''}`} onClick={(e) => handleVerseClick(verse, e)}>
                        <sup className="verse-number">{verse.verse_number}</sup>
                        {verse.text}
                        {hasNote && <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full ml-0.5 mb-0.5 align-middle" />}{' '}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="border-l border-border pl-6">
                <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                  {compareTranslation}
                </p>
                <div className="bible-text space-y-0" style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss }}>
                  {compareVerses.map((verse) => (
                    <span key={verse.id} className="text-muted-foreground/90">
                      <sup className="verse-number">{verse.verse_number}</sup>
                      {verse.text}{' '}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          /* ── NORMAL VIEW ── */
          ) : (
            <div className="bible-text space-y-0" style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss }}>
              {verses.map((verse) => {
                const hlColor = highlights[verse.id]
                const hasNote = !!notes[verse.id]
                const hlClass = hlColor ? `hl-${hlColor}` : ''
                return (
                  <span
                    key={verse.id}
                    id={`verse-${verse.verse_number}`}
                    className={`relative cursor-pointer rounded-sm transition-colors hover:bg-primary/8 ${hlClass} ${
                      selectedVerse?.id === verse.id ? 'ring-1 ring-primary/30 rounded' : ''
                    }`}
                    onClick={(e) => handleVerseClick(verse, e)}
                    title={`${book.name} ${chapter}:${verse.verse_number}`}
                  >
                    <sup className="verse-number">{verse.verse_number}</sup>
                    {verse.text}
                    {hasNote && (
                      <span
                        className="inline-block w-1.5 h-1.5 bg-accent rounded-full ml-0.5 mb-0.5 align-middle"
                        title="You have a note on this verse"
                      />
                    )}{' '}
                  </span>
                )
              })}
            </div>
          )}

          {/* Chapter navigation */}
          <div className="flex items-center justify-between mt-16 pt-8 border-t border-border" data-ui>
            {prevHref ? (
              <Link href={prevHref}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" />
                  {prevChapter
                    ? `${book.name} ${prevChapter}`
                    : `${prevBook?.name} ${prevBook?.chapters}`}
                </Button>
              </Link>
            ) : (
              <div />
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                {book.name} {chapter} &bull; {translation}
              </p>
            </div>

            {nextHref ? (
              <Link href={nextHref}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {nextChapter
                    ? `${book.name} ${nextChapter}`
                    : `${nextBook?.name} 1`}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>

      {/* Verse popup */}
      {selectedVerse && popupAnchor && (
        <VersePopup
          verse={selectedVerse}
          bookName={book.name}
          translation={translation}
          currentHighlight={(highlights[selectedVerse.id] as HighlightColor) ?? null}
          currentNote={notes[selectedVerse.id]?.content ?? ''}
          isBookmarked={bookmarks.has(selectedVerse.id)}
          onHighlight={(color) => handleHighlight(selectedVerse.id, color)}
          onSaveNote={(content) => handleSaveNote(selectedVerse.id, content)}
          onBookmark={() => handleBookmark(selectedVerse.id)}
          onClose={closePopup}
          onOpenChat={() => { closePopup(); setChatOpen(true) }}
          anchor={popupAnchor}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Mobile FAB — Ask Ezra (hidden on sm+, hidden when chat or verse popup is open) */}
      {!chatOpen && !selectedVerse && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-20 right-4 z-20 sm:hidden flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-3 text-sm font-medium active:scale-95 transition-transform"
          style={{ fontFamily: 'system-ui' }}
          aria-label="Ask Ezra"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          Ask Ezra
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <ChatPanel
          currentPassage={`${book.name} ${chapter} (${translation})`}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
