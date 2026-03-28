'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  ScrollText,
  ChevronDown,
  ChevronUp,
  X,
  Type,
} from 'lucide-react'
import { VersePopup } from '@/components/verse-popup'
import { ChatPanel } from '@/components/chat-panel'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
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
}

const TRANSLATIONS = [
  { code: 'WEB', name: 'World English Bible' },
  { code: 'KJV', name: 'King James Version' },
  { code: 'ESV', name: 'Eng. Standard Version' },
]

const HIGHLIGHT_COLORS: { color: HighlightColor; label: string; className: string }[] = [
  { color: 'yellow', label: 'Yellow',  className: 'bg-yellow-300' },
  { color: 'green',  label: 'Green',   className: 'bg-green-300' },
  { color: 'blue',   label: 'Blue',    className: 'bg-blue-300' },
  { color: 'pink',   label: 'Pink',    className: 'bg-pink-300' },
  { color: 'purple', label: 'Purple',  className: 'bg-purple-300' },
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
  const [commentaryOpen, setCommentaryOpen] = useState(false)
  const [commentaryText, setCommentaryText] = useState('')
  const [commentaryLoading, setCommentaryLoading] = useState(false)
  const commentaryFetched = useRef(false)
  const readerRef = useRef<HTMLDivElement>(null)
  const [showVerseHint, setShowVerseHint] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

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
      .catch(() => {}) // non-critical
  }, [book.id, chapter, isAuthenticated])

  // Fetch compare translation verses
  useEffect(() => {
    if (!compareTranslation) { setCompareVerses([]); return }
    fetch(`/api/verses?book=${book.id}&chapter=${chapter}&translation=${compareTranslation}`)
      .then((r) => r.json())
      .then((d) => setCompareVerses(d.verses ?? []))
      .catch(() => setCompareVerses([]))
  }, [compareTranslation, book.id, chapter])

  // Stream commentary
  async function loadCommentary() {
    if (commentaryFetched.current) return
    commentaryFetched.current = true
    setCommentaryLoading(true)
    try {
      const res = await fetch(`/api/commentary?book_id=${book.id}&chapter=${chapter}`)
      if (!res.ok || !res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setCommentaryText(acc)
      }
    } catch {
      setCommentaryText('Unable to load commentary.')
    } finally {
      setCommentaryLoading(false)
    }
  }

  function handleCommentaryToggle() {
    setCommentaryOpen((o) => {
      if (!o) loadCommentary()
      return !o
    })
  }

  const fontSizePx = { sm: '0.9rem', md: '1.05rem', lg: '1.2rem' }[fontSize]

  function handleVerseClick(verse: Verse, event: React.MouseEvent) {
    // Don't open popup if user is selecting text
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) return

    setSelectedVerse(verse)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setPopupAnchor({ x: rect.left, y: rect.bottom + window.scrollY + 8 })
    // Update URL hash without navigation
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
    if (!isAuthenticated) {
      toast.info('Sign in to save highlights')
      return
    }

    if (color === null) {
      // Remove highlight
      setHighlights((prev) => {
        const next = { ...prev }
        delete next[verseId]
        return next
      })
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
    if (!isAuthenticated) {
      toast.info('Sign in to save notes')
      return
    }

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

  // Touch swipe gestures for mobile chapter navigation
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
      // Only trigger on horizontal swipe > 60px with small vertical drift
      if (Math.abs(dx) < 60 || Math.abs(dy) > 80) return
      // Don't trigger if a popup is open
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

  // Keyboard shortcuts: j/ArrowRight = next, k/ArrowLeft = prev, / = chat, Esc = close
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
        else setChatOpen(false)
      } else if (e.key === '?' || e.key === 'F1') {
        e.preventDefault()
        setShortcutsOpen((o) => !o)
      } else if (e.key === 'f' || e.key === 'F') {
        setFontSize((s) => s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'sm')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextHref, prevHref, selectedVerse])

  if (!verses || verses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
          Bible text not loaded yet. Run the seed script first.
        </p>
        <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily: 'system-ui' }}>
          <code className="bg-muted px-1 rounded">npx ts-node scripts/seed-bible.ts</code>
        </p>
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

          {/* Row 2: Tool controls — labeled */}
          <div className="max-w-3xl mx-auto px-4 pb-2 flex items-center gap-1 flex-wrap">
            {/* Translation */}
            <div className="flex items-center gap-1 border border-border rounded-lg px-2 h-7">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Translation:</span>
              <Select value={translation} onValueChange={handleTranslationChange}>
                <SelectTrigger className="h-6 border-0 bg-transparent text-xs font-semibold p-0 w-auto gap-0.5 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSLATIONS.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      <span className="font-semibold">{t.code}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{t.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compare translation — clearly labelled */}
            {compareTranslation ? (
              <div className="flex items-center gap-1 border border-primary/40 bg-primary/5 rounded-lg px-2 h-7">
                <Columns2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-xs font-medium text-primary" style={{ fontFamily: 'system-ui' }}>
                  Comparing {translation} · {compareTranslation}
                </span>
                <button
                  className="ml-1 text-primary/60 hover:text-primary"
                  onClick={() => setCompareTranslation(null)}
                  title="Close comparison"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Select
                value="none"
                onValueChange={(v) => v !== 'none' && setCompareTranslation(v)}
              >
                <SelectTrigger className="h-7 border border-border rounded-lg px-2 text-xs text-muted-foreground bg-transparent gap-1 w-auto focus:ring-0">
                  <Columns2 className="w-3 h-3" />
                  <span style={{ fontFamily: 'system-ui' }}>Compare translations</span>
                </SelectTrigger>
                <SelectContent>
                  {TRANSLATIONS.filter((t) => t.code !== translation).map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      Show {t.code} side-by-side — <span className="text-muted-foreground">{t.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Font size */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal"
              onClick={() => setFontSize((s) => s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'sm')}
              title="Change font size"
            >
              <Type className="w-3 h-3" />
              <span style={{ fontFamily: 'system-ui' }}>{fontSize === 'sm' ? 'Small' : fontSize === 'md' ? 'Medium' : 'Large'}</span>
            </Button>

            {/* AI Chat */}
            <Button
              variant={chatOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal ml-auto"
              onClick={() => setChatOpen((o) => !o)}
            >
              <MessageSquare className="w-3 h-3" />
              <span style={{ fontFamily: 'system-ui' }}>Ask Logos</span>
            </Button>

            {/* Keyboard shortcuts hint */}
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
                  { key: '/', desc: 'Open Logos chat' },
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

        {/* Bible text */}
        <div className="max-w-3xl mx-auto px-4 py-10 pb-24" ref={readerRef}>
          {/* Chapter header */}
          <div className="mb-8 text-center">
            <h1
              className="text-3xl font-bold text-foreground"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {book.name}
            </h1>
            <p
              className="text-muted-foreground mt-1 text-base"
              style={{ fontFamily: 'system-ui' }}
            >
              Chapter {chapter}
            </p>
          </div>

          {/* Verse click hint — shown once to new users */}
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
              <button
                onClick={dismissVerseHint}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Dismiss hint"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Verses — normal or side-by-side */}
          {compareTranslation && compareVerses.length > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                  {translation}
                </p>
                <div className="bible-text space-y-0" style={{ fontSize: fontSizePx }}>
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
                <div className="bible-text space-y-0" style={{ fontSize: fontSizePx }}>
                  {compareVerses.map((verse) => (
                    <span key={verse.id} className="text-muted-foreground/90">
                      <sup className="verse-number">{verse.verse_number}</sup>
                      {verse.text}{' '}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bible-text space-y-0" style={{ fontSize: fontSizePx }}>
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
              <p
                className="text-xs text-muted-foreground"
                style={{ fontFamily: 'system-ui' }}
              >
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

          {/* Chapter Commentary */}
          <div className="mt-10 border-t border-border pt-6">
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/40 transition-colors text-left"
              onClick={handleCommentaryToggle}
              data-ui
            >
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                  Chapter Commentary
                </span>
                {!commentaryFetched.current && (
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    Scholarly study notes
                  </span>
                )}
              </div>
              {commentaryOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {commentaryOpen && (
              <div className="mt-3 px-4 pb-6">
                {!commentaryText && commentaryLoading ? (
                  <div className="space-y-2 py-2">
                    {[100, 88, 95, 78, 90, 82, 70].map((w, i) => (
                      <div key={i} className="h-2.5 bg-muted rounded animate-pulse" style={{ width: `${w}%`, animationDelay: `${i*60}ms` }} />
                    ))}
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-sm [&>p]:mb-4 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-1.5 [&>strong]:font-semibold [&>ul]:mt-2 [&>ul]:mb-4 [&>ul>li]:mb-1">
                    <ReactMarkdown>{commentaryText}</ReactMarkdown>
                    {commentaryLoading && (
                      <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                )}
              </div>
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
          anchor={popupAnchor}
          isAuthenticated={isAuthenticated}
        />
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
