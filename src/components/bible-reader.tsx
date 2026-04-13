'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { BookSidebar } from '@/components/book-sidebar'
import { MobileBookDrawer } from '@/components/mobile-book-drawer'
import { isRedLetter } from '@/lib/red-letter-verses'
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
  BookOpen,
  ChevronDown,
  NotebookPen,
} from 'lucide-react'
import { VersePopup } from '@/components/verse-popup'
import { ChatPanel } from '@/components/chat-panel'
import { PassageSearch } from '@/components/passage-search'
import { StudyNotesPanel } from '@/components/study-notes-panel'
import { toast } from 'sonner'
import { track } from '@vercel/analytics'
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
  isPro?: boolean
  prevChapter: number | null
  nextChapter: number | null
  prevBook: BookMeta | null
  nextBook: BookMeta | null
  esvError?: string
  chapterOverview?: { summary: string | null; key_ideas: string[] | null; connections: string | null } | null
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
  isPro = false,
  prevChapter,
  nextChapter,
  prevBook,
  nextBook,
  esvError,
  chapterOverview,
}: Props) {
  const router = useRouter()
  const [highlights, setHighlights] = useState<Record<number, string>>(initialHighlights)
  const [notes, setNotes] = useState<Record<number, { id: string; content: string }>>(initialNotes)
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null)
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [compareTranslation, setCompareTranslation] = useState<string | null>(null)
  const [compareVerses, setCompareVerses] = useState<Verse[]>([])
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif')
  const [lineSpacing, setLineSpacing] = useState<'tight' | 'normal' | 'relaxed' | 'loose'>('relaxed')
  const [viewMode, setViewMode] = useState<'paragraph' | 'verse'>('paragraph')
  const [typographyOpen, setTypographyOpen] = useState(false)
  const [showRedLetter, setShowRedLetter] = useState(true)
  const readerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showVerseHint, setShowVerseHint] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [chapterOverviewOpen, setChapterOverviewOpen] = useState(false)

  interface OtNtConnection { id: number; type: string; note: string | null; ref: string; book_name: string; chapter: number; verse: number; direction: string }
  interface CrossRef { book_id: number; book_name: string; chapter: number; verse: number; ref: string }
  const [connections, setConnections] = useState<OtNtConnection[]>([])
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)

  // Interlinear state
  const [interlinearOn] = useState(false)
  const [interlinearWords, setInterlinearWords] = useState<Record<number, TaggedWord[]>>({})
  const [interlinearLoading, setInterlinearLoading] = useState(false)
  const [interlinearFailed, setInterlinearFailed] = useState(false)
  const [selectedInterlinearWord, setSelectedInterlinearWord] = useState<TaggedWord | null>(null)

  // Word count → reading time (~200 wpm)
  const wordCount = verses.reduce((n, v) => n + v.text.split(/\s+/).length, 0)
  const readingMinutes = Math.max(1, Math.round(wordCount / 200))

  // Persist / restore all typography settings
  useEffect(() => {
    const ff = localStorage.getItem('bv_font_family') as 'serif' | 'sans' | 'mono' | null
    const fs = localStorage.getItem('bv_font_size') as 'sm' | 'md' | 'lg' | null
    const sp = localStorage.getItem('bv_line_spacing') as 'tight' | 'normal' | 'relaxed' | 'loose' | null
    const vm = localStorage.getItem('bv_view_mode') as 'paragraph' | 'verse' | null
    const rl = localStorage.getItem('bv_red_letter')
    if (ff) setFontFamily(ff)
    if (fs) setFontSize(fs)
    if (sp) setLineSpacing(sp)
    if (vm) setViewMode(vm)
    if (rl !== null) setShowRedLetter(rl === '1')
  }, [])

  // Save last reading position
  useEffect(() => {
    if (!isAuthenticated) return
    localStorage.setItem('bv_last_position', JSON.stringify({
      book: book.name.toLowerCase().replace(/\s+/g, '-'),
      chapter,
      translation,
    }))
  }, [book.name, chapter, translation, isAuthenticated])

  // Scroll progress is tracked via onScroll on the center column div

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
    setInterlinearFailed(false)

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
      if (!res.ok) {
        setInterlinearFailed(true)
        toast.error(`Interlinear: ${data.error ?? res.statusText}`)
      } else if (data.verses && Object.keys(data.verses).length > 0) {
        const words: Record<number, TaggedWord[]> = {}
        for (const [k, v] of Object.entries(data.verses)) {
          words[parseInt(k, 10)] = v as TaggedWord[]
        }
        setInterlinearWords(words)
        try { localStorage.setItem(cacheKey, JSON.stringify(words)) } catch { /* quota exceeded */ }
      } else {
        // API returned ok but empty verses — parsing failed server-side
        setInterlinearFailed(true)
        toast.error('Interlinear data could not be parsed. Try again.')
      }
    } catch {
      setInterlinearFailed(true)
      toast.error('Could not load interlinear data')
    } finally {
      setInterlinearLoading(false)
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

  // Analytics: track chapter opens for all visitors
  useEffect(() => {
    track('chapter_opened', { book: book.name, chapter, translation })
  }, [book.name, chapter, translation])

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

  // Fetch cross-references + OT/NT connections for selected verse
  useEffect(() => {
    if (!selectedVerse) { setConnections([]); setCrossRefs([]); return }
    setConnectionsLoading(true)
    const { book_id, chapter_number, verse_number } = selectedVerse
    Promise.all([
      fetch(`/api/crossref?book_id=${book_id}&chapter=${chapter_number}&verse=${verse_number}`).then(r => r.json()).catch(() => ({ crossRefs: [] })),
      fetch(`/api/ot-nt-connections?book_id=${book_id}&chapter=${chapter_number}&verse=${verse_number}`).then(r => r.json()).catch(() => ({ connections: [] })),
    ]).then(([crData, conData]) => {
      setCrossRefs(crData.crossRefs ?? [])
      setConnections(conData.connections ?? [])
    }).finally(() => setConnectionsLoading(false))
  }, [selectedVerse])

  // ── Derived values ───────────────────────────────────────────────────────────

  const fontSizePx = { sm: '0.9rem', md: '1.05rem', lg: '1.2rem' }[fontSize]
  const fontFamilyCss = fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif'
  const lineHeightCss = { tight: '1.55', normal: '1.7', relaxed: '1.9', loose: '2.2' }[lineSpacing]
  const isOT = book.testament === 'OT' || book.testament === 'Old'

  // ── Event handlers ───────────────────────────────────────────────────────────

  function handleVerseClick(verse: Verse, event: React.MouseEvent) {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) return
    setSelectedVerse(verse)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setPopupAnchor({ x: rect.left, y: rect.bottom + 8 })
    history.replaceState(null, '', `#v${verse.verse_number}`)
    track('verse_popup_opened', { book: book.name, chapter, verse: verse.verse_number })
  }

  // Scroll to verse from URL hash on mount — also auto-selects it so connections load
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#v')) return
    const vNum = parseInt(hash.slice(2), 10)
    if (isNaN(vNum)) return
    setTimeout(() => {
      const container = scrollRef.current
      const el = document.getElementById(`verse-${vNum}`)
      if (el && container) {
        const elRect = el.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        container.scrollTop += elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2
      }
      // Auto-select the verse so the right panel loads connections
      const verse = verses.find((v) => v.verse_number === vNum)
      if (verse) setSelectedVerse(verse)
    }, 350)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Eagerly prefetch adjacent chapters for fast navigation
  useEffect(() => {
    if (nextHref) router.prefetch(nextHref)
    if (prevHref) router.prefetch(prevHref)
    // Prefetch 2 chapters ahead
    const slug = book.name.toLowerCase().replace(/\s+/g, '-')
    for (let i = 1; i <= 3; i++) {
      const ahead = chapter + i
      if (ahead <= book.chapters) router.prefetch(`/dashboard/reading/${slug}/${ahead}?translation=${translation}`)
      const behind = chapter - i
      if (behind >= 1) router.prefetch(`/dashboard/reading/${slug}/${behind}?translation=${translation}`)
    }
  }, [nextHref, prevHref, router, book.name, book.chapters, chapter, translation])

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
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (target.isContentEditable) return
      if (e.key === 'j' || e.key === 'ArrowRight') {
        if (nextHref) router.push(nextHref)
      } else if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (prevHref) router.push(prevHref)
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setChatOpen(true)
      } else if (e.key === 'Escape') {
        if (typographyOpen) setTypographyOpen(false)
        else if (shortcutsOpen) setShortcutsOpen(false)
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
    <>
    {/* ── Keyboard shortcuts overlay ── */}
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
        </div>
      </div>
    )}

    {/* ── Interlinear word popup ── */}
    {selectedInterlinearWord && (
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/20" onClick={() => setSelectedInterlinearWord(null)}>
        <div className="bg-card border border-border rounded-2xl shadow-xl p-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-3xl font-bold leading-none" dir={isOT ? 'rtl' : 'ltr'} style={{ fontFamily: isOT ? 'serif' : 'system-ui' }}>
                {selectedInterlinearWord.original || '—'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{selectedInterlinearWord.transliteration}</p>
            </div>
            <button onClick={() => setSelectedInterlinearWord(null)} className="text-muted-foreground hover:text-foreground mt-1"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            {selectedInterlinearWord.number && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${selectedInterlinearWord.number.startsWith('H') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                {selectedInterlinearWord.number}
              </span>
            )}
            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {selectedInterlinearWord.word.replace(/[.,;:!?'"()[\]]/g, '')}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ fontFamily: 'system-ui' }}>{selectedInterlinearWord.brief}</p>
        </div>
      </div>
    )}

    {/* ── THREE-COLUMN LAYOUT ── */}
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>

      {/* ── LEFT: Book + Chapter sidebar ── */}
      <Suspense fallback={<aside className="hidden lg:flex w-52 shrink-0 border-r border-border bg-background" />}>
        <BookSidebar activeBookId={book.id} />
      </Suspense>

      {/* ── CENTER: Toolbar + Text ── */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto min-w-0 ${(chatOpen || notesOpen) ? 'hidden lg:block' : ''}`}
        onScroll={(e) => {
          const el = e.currentTarget
          const total = el.scrollHeight - el.clientHeight
          setScrollProgress(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0)
        }}
      >
        {/* Reading toolbar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border" data-ui>
          {/* Scroll progress bar */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary/70 transition-all duration-100 ease-out" style={{ width: `${scrollProgress}%` }} />

          <div className="px-3 py-2 flex items-center gap-1.5">
            <Suspense fallback={null}>
              <MobileBookDrawer activeBookId={book.id} />
            </Suspense>
            <PassageSearch currentBook={book} currentChapter={chapter} translation={translation} />
            <div className="ml-auto flex items-center gap-1 shrink-0">
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

            {/* Typography panel button */}
            <div className="relative">
              <Button
                variant={typographyOpen ? 'secondary' : 'outline'}
                size="sm"
                className="h-7 w-7 px-0 text-xs gap-1 font-normal"
                onClick={() => setTypographyOpen((o) => !o)}
                title="Typography settings"
              >
                <Type className="w-3 h-3" />
              </Button>

              {typographyOpen && (
                <div
                  className="fixed z-[60] w-64 bg-popover border border-border rounded-xl shadow-xl p-4 space-y-4"
                  style={{ fontFamily: 'system-ui', top: '96px', right: '8px' }}
                  onMouseLeave={() => setTypographyOpen(false)}
                >
                  {/* VIEW */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">View</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(['paragraph', 'verse'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => { setViewMode(v); localStorage.setItem('bv_view_mode', v) }}
                          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${viewMode === v ? 'bg-foreground text-background' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                        >
                          <span className="text-[10px] leading-none opacity-60">{v === 'paragraph' ? '¶' : '≡'}</span>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                      <button
                        onClick={() => {}}
                        className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground/40 cursor-not-allowed relative"
                      >
                        <span className="text-[10px] leading-none opacity-40">αβ</span>
                        Interlinear
                        <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground px-1 rounded-full font-bold">Pro</span>
                      </button>
                    </div>
                  </div>

                  {/* FONT */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Font</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(['serif', 'sans', 'mono'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => { setFontFamily(f); localStorage.setItem('bv_font_family', f) }}
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${fontFamily === f ? 'bg-foreground text-background' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                          style={{ fontFamily: f === 'serif' ? 'Georgia, serif' : f === 'mono' ? 'ui-monospace, monospace' : 'system-ui' }}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SIZE */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Size</p>
                    <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-1.5">
                      <button
                        onClick={() => { const s = fontSize === 'lg' ? 'md' : 'sm'; setFontSize(s); localStorage.setItem('bv_font_size', s) }}
                        className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors w-6 h-6 flex items-center justify-center"
                      >−</button>
                      <span className="text-sm font-medium">
                        {fontSize === 'sm' ? 'Small' : fontSize === 'md' ? 'Medium' : 'Large'}
                      </span>
                      <button
                        onClick={() => { const s = fontSize === 'sm' ? 'md' : 'lg'; setFontSize(s); localStorage.setItem('bv_font_size', s) }}
                        className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors w-6 h-6 flex items-center justify-center"
                      >+</button>
                    </div>
                  </div>

                  {/* SPACING */}
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">Spacing</p>
                    <div className="grid grid-cols-4 gap-1">
                      {(['tight', 'normal', 'relaxed', 'loose'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setLineSpacing(s); localStorage.setItem('bv_line_spacing', s) }}
                          className={`px-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${lineSpacing === s ? 'bg-foreground text-background' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RED LETTER */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div>
                      <p className="text-xs font-medium">Red letter</p>
                      <p className="text-[10px] text-muted-foreground">Words of Jesus in red</p>
                    </div>
                    <button
                      onClick={() => { const v = !showRedLetter; setShowRedLetter(v); localStorage.setItem('bv_red_letter', v ? '1' : '0') }}
                      className={`w-9 h-5 rounded-full transition-colors shrink-0 ${showRedLetter ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${showRedLetter ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <Button
              variant={notesOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal"
              onClick={() => { setNotesOpen((o) => !o); if (chatOpen) setChatOpen(false) }}
              title="Study notes"
            >
              <NotebookPen className="w-3 h-3" />
              <span className="hidden sm:inline" style={{ fontFamily: 'system-ui' }}>Notes</span>
            </Button>

            {/* Ask Ezra */}
            <Button
              variant={chatOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs gap-1 font-normal"
              onClick={() => { if (!chatOpen) track('chat_opened', { book: book.name, chapter }); setChatOpen((o) => !o); if (notesOpen) setNotesOpen(false) }}
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline" style={{ fontFamily: 'system-ui' }}>Ezra</span>
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
        </div>{/* end sticky toolbar */}

        {/* Bible text */}
        <div className="max-w-3xl mx-auto px-8 py-10 pb-32" ref={readerRef}>
          {/* Chapter header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {book.name}
            </h1>
            <p className="text-2xl text-muted-foreground/50 mt-0.5 font-light" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {chapter}
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground/40" style={{ fontFamily: 'system-ui' }}>
                {verses.length} verses · ~{readingMinutes} min
              </span>
              <span className="text-muted-foreground/20 text-xs">·</span>
              <Link
                href={`/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/overview`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
                style={{ fontFamily: 'system-ui' }}
              >
                <BookOpen className="w-3 h-3" />
                Book overview
              </Link>
            </div>
          </div>

          {/* Chapter Overview — shown inline like Rhema */}
          {chapterOverview?.summary && (
            <div className="mb-8 rounded-xl border border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>
                  Chapter Overview
                </p>
                <button
                  onClick={() => setChapterOverviewOpen((o) => !o)}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  style={{ fontFamily: 'system-ui' }}
                >
                  {chapterOverviewOpen ? 'less' : 'more'}
                </button>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80" style={{ fontFamily: 'system-ui' }}>
                {chapterOverview.summary}
              </p>
              {chapterOverviewOpen && chapterOverview.key_ideas && chapterOverview.key_ideas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wide mb-2" style={{ fontFamily: 'system-ui' }}>
                        Key Ideas
                      </p>
                      <ul className="space-y-1">
                        {chapterOverview.key_ideas.map((idea, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5 shrink-0">·</span>
                            <span style={{ fontFamily: 'system-ui' }}>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {chapterOverview.connections && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wide mb-1" style={{ fontFamily: 'system-ui' }}>
                        Context
                      </p>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                        {chapterOverview.connections}
                      </p>
                    </div>
                  )}
            </div>
          )}

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

          {/* Interlinear loading / error banner */}
          {interlinearLoading && (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-primary/8 border border-primary/20 rounded-xl text-sm" style={{ fontFamily: 'system-ui' }}>
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-medium text-foreground">Loading {isOT ? 'Hebrew' : 'Greek'} interlinear</span>
              <span className="text-muted-foreground">— takes 20–30 seconds…</span>
            </div>
          )}
          {interlinearFailed && !interlinearLoading && Object.keys(interlinearWords).length === 0 && (
            <div className="flex items-center justify-between gap-3 mb-6 px-4 py-3 bg-destructive/8 border border-destructive/20 rounded-xl text-sm" style={{ fontFamily: 'system-ui' }}>
              <span className="text-muted-foreground">Interlinear failed to load.</span>
              <button
                onClick={loadInterlinear}
                className="text-primary hover:underline font-medium shrink-0"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── INTERLINEAR VIEW ── */}
          {interlinearOn && Object.keys(interlinearWords).length > 0 ? (
            <div className="space-y-6">
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
                    {/* Desktop: side-by-side | Mobile: stacked */}
                    <div className="flex flex-col sm:flex-row sm:gap-6">

                      {/* Left: readable verse text */}
                      <div className="sm:w-2/5 flex gap-2 items-start mb-3 sm:mb-0">
                        <sup
                          className="verse-number shrink-0 mt-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setSelectedVerse(verse)
                            setPopupAnchor({ x: rect.left, y: rect.bottom + 8 })
                            history.replaceState(null, '', `#v${verse.verse_number}`)
                          }}
                        >
                          {verse.verse_number}
                        </sup>
                        <p style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss }} className="leading-relaxed text-foreground/80">
                          {verse.text}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="hidden sm:block w-px bg-border shrink-0" />

                      {/* Right (desktop) / Below (mobile): word-by-word grid */}
                      <div className="sm:flex-1 flex flex-wrap gap-x-2 gap-y-3 leading-none pl-0 sm:pl-2 border-t border-border/40 pt-3 sm:border-0 sm:pt-0">
                        {words.length > 0 ? words.map((w, i) => (
                          <button
                            key={i}
                            onClick={() => w.number ? setSelectedInterlinearWord(w) : undefined}
                            className={`flex flex-col items-center text-center rounded px-1 py-1 transition-colors ${
                              w.number ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'
                            }`}
                            title={w.number ? `${w.number} — ${w.brief}` : undefined}
                          >
                            <span className="text-sm" style={{ fontFamily: fontFamilyCss }}>
                              {w.word}
                            </span>
                            {w.original && (
                              <span
                                className={`text-[12px] font-semibold leading-none mt-1 ${
                                  w.number?.startsWith('H')
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                                dir={isOT ? 'rtl' : 'ltr'}
                              >
                                {w.original}
                              </span>
                            )}
                            {w.transliteration && (
                              <span className="text-[9px] text-muted-foreground/50 font-mono leading-none mt-0.5">
                                {w.transliteration}
                              </span>
                            )}
                          </button>
                        )) : (
                          <span className="text-sm text-muted-foreground italic" style={{ fontFamily: 'system-ui' }}>
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
                <div className="space-y-0.5 -mx-3">
                  {verses.map((verse) => {
                    const hlColor = highlights[verse.id]
                    const hasNote = !!notes[verse.id]
                    const hlClass = hlColor ? `hl-${hlColor}` : ''
                    return (
                      <div key={verse.id} className={`flex gap-2 cursor-pointer rounded-lg px-3 py-1.5 transition-colors ${hlClass} ${selectedVerse?.id === verse.id ? 'bg-primary/8' : 'hover:bg-primary/5'}`} onClick={(e) => handleVerseClick(verse, e)}>
                        <span className="shrink-0 w-5 text-right select-none" style={{ fontSize: '0.6rem', fontFamily: 'system-ui', fontWeight: 700, opacity: 0.3, paddingTop: '0.25em' }}>{verse.verse_number}</span>
                        <p className="flex-1" style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss, lineHeight: lineHeightCss }}>
                          {verse.text}
                          {hasNote && <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full ml-0.5 mb-0.5 align-middle" />}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="border-l border-border pl-6">
                <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                  {compareTranslation}
                </p>
                <div className="space-y-0.5">
                  {compareVerses.map((verse) => (
                    <div key={verse.id} className="flex gap-2 px-1 py-1.5">
                      <span className="shrink-0 w-5 text-right select-none" style={{ fontSize: '0.6rem', fontFamily: 'system-ui', fontWeight: 700, opacity: 0.25, paddingTop: '0.25em' }}>{verse.verse_number}</span>
                      <p className="flex-1 text-muted-foreground/80" style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss, lineHeight: lineHeightCss }}>{verse.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          /* ── VERSE VIEW: one verse per row ── */
          ) : viewMode === 'verse' ? (
            <div className="space-y-0.5 -mx-3">
              {verses.map((verse) => {
                const hlColor = highlights[verse.id]
                const hasNote = !!notes[verse.id]
                const hlClass = hlColor ? `hl-${hlColor}` : ''
                const redLetter = showRedLetter && isRedLetter(verse.book_id, verse.chapter_number, verse.verse_number)
                return (
                  <div
                    key={verse.id}
                    id={`verse-${verse.verse_number}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('verse', JSON.stringify({
                        text: verse.text,
                        ref: `${book.name} ${chapter}:${verse.verse_number}`
                      }))
                    }}
                    className={`flex gap-2 cursor-pointer rounded-lg px-3 py-1.5 transition-colors ${hlClass} ${selectedVerse?.id === verse.id ? 'bg-primary/8' : 'hover:bg-primary/5'}`}
                    onClick={(e) => handleVerseClick(verse, e)}
                  >
                    <span className="shrink-0 w-5 text-right select-none" style={{ fontSize: '0.6rem', fontFamily: 'system-ui', fontWeight: 700, opacity: 0.3, paddingTop: '0.25em' }}>
                      {verse.verse_number}
                    </span>
                    <p className={`flex-1 ${redLetter ? 'text-red-600 dark:text-red-400' : ''}`} style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss, lineHeight: lineHeightCss }}>
                      {verse.text}
                      {hasNote && <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full ml-0.5 mb-0.5 align-middle" title="You have a note on this verse" />}
                    </p>
                  </div>
                )
              })}
            </div>

          /* ── PARAGRAPH VIEW: flowing inline text ── */
          ) : (
            <p className="text-foreground" style={{ fontSize: fontSizePx, fontFamily: fontFamilyCss, lineHeight: lineHeightCss }}>
              {verses.map((verse) => {
                const hlColor = highlights[verse.id]
                const hasNote = !!notes[verse.id]
                const redLetter = showRedLetter && isRedLetter(verse.book_id, verse.chapter_number, verse.verse_number)
                return (
                  <span key={verse.id} id={`verse-${verse.verse_number}`}>
                    <sup
                      className="select-none cursor-pointer hover:text-primary transition-colors"
                      style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'system-ui', opacity: 0.35, marginRight: '0.15em' }}
                      onClick={(e) => handleVerseClick(verse, e as unknown as React.MouseEvent)}
                    >
                      {verse.verse_number}
                    </sup>
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation()
                        e.dataTransfer.setData('verse', JSON.stringify({
                          text: verse.text,
                          ref: `${book.name} ${chapter}:${verse.verse_number}`
                        }))
                      }}
                      className={`cursor-pointer transition-colors rounded ${hlColor ? `hl-${hlColor}` : ''} ${
                        selectedVerse?.id === verse.id ? 'bg-primary/10' : 'hover:bg-primary/5'
                      } ${redLetter ? 'text-red-600 dark:text-red-400' : ''}`}
                      onClick={(e) => handleVerseClick(verse, e as unknown as React.MouseEvent)}
                    >
                      {verse.text}
                    </span>
                    {hasNote && <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full ml-0.5 mb-0.5 align-middle" title="You have a note on this verse" />}
                    {' '}
                  </span>
                )
              })}
            </p>
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

      {/* ── RIGHT: Connections panel ── */}
      {!chatOpen && (
        <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-border overflow-y-auto bg-background">
          <div className="px-4 py-5">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-4" style={{ fontFamily: 'system-ui' }}>
              Connections
            </p>
            {selectedVerse ? (
              <div>
                <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  {book.name} {chapter}:{selectedVerse.verse_number}
                </p>
                <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed border-b border-border pb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  &ldquo;{selectedVerse.text.length > 130 ? selectedVerse.text.slice(0, 130) + '…' : selectedVerse.text}&rdquo;
                </p>
                {connectionsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    Loading…
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cross-references */}
                    {crossRefs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2" style={{ fontFamily: 'system-ui' }}>
                          Cross-references
                        </p>
                        <div className="space-y-0.5">
                          {crossRefs.map((c, i) => (
                            <Link key={i} href={`/dashboard/reading/${c.book_name.toLowerCase().replace(/\s+/g, '-')}/${c.chapter}?translation=${translation}#v${c.verse}`}>
                              <div className="px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors group">
                                <p className="text-xs font-medium text-primary group-hover:underline" style={{ fontFamily: 'system-ui' }}>{c.ref}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* OT/NT connections (when available) */}
                    {connections.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2" style={{ fontFamily: 'system-ui' }}>
                          {isOT ? 'New Testament' : 'Old Testament'}
                        </p>
                        <div className="space-y-1.5">
                          {connections.map((c) => (
                            <Link key={c.id} href={`/dashboard/reading/${c.book_name.toLowerCase().replace(/\s+/g, '-')}/${c.chapter}?translation=${translation}#v${c.verse}`}>
                              <div className="px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                                <p className="text-xs font-semibold text-primary" style={{ fontFamily: 'system-ui' }}>{c.ref}</p>
                                <p className="text-[10px] text-muted-foreground/60 capitalize mt-0.5" style={{ fontFamily: 'system-ui' }}>{c.type}</p>
                                {c.note && <p className="text-[11px] mt-1 leading-relaxed text-foreground/70" style={{ fontFamily: 'system-ui' }}>{c.note}</p>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Empty state */}
                    {crossRefs.length === 0 && connections.length === 0 && (
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>No cross-references found for this verse.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {chapterOverview?.summary ? (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2" style={{ fontFamily: 'system-ui' }}>
                      Chapter Overview
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                      {chapterOverview.summary}
                    </p>
                    {chapterOverview.key_ideas && chapterOverview.key_ideas.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'system-ui' }}>Key Ideas</p>
                        <ul className="space-y-1">
                          {chapterOverview.key_ideas.slice(0, 5).map((idea, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="text-primary shrink-0 mt-0.5">·</span>
                              <span style={{ fontFamily: 'system-ui' }}>{idea}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    Tap any verse to see cross-references and connections.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Chat panel inside the 3-col row */}
      {chatOpen && (
        <ChatPanel
          currentPassage={`${book.name} ${chapter} (${translation})`}
          onClose={() => setChatOpen(false)}
          isPro={isPro}
        />
      )}

      {/* Notes panel — desktop inline, mobile full-screen */}
      {notesOpen && (
        <>
          {/* Desktop: side panel */}
          <div className="hidden lg:flex w-[420px] shrink-0 border-l border-border overflow-hidden flex-col">
            <StudyNotesPanel
              bookId={book.id}
              bookName={book.name}
              chapter={chapter}
              onClose={() => setNotesOpen(false)}
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* Mobile: full-screen overlay */}
          <div className="lg:hidden fixed inset-0 z-40 bg-background flex flex-col">
            <StudyNotesPanel
              bookId={book.id}
              bookName={book.name}
              chapter={chapter}
              onClose={() => setNotesOpen(false)}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </>
      )}
    </div>{/* end 3-col layout */}

    {/* Verse popup — fixed overlay, outside the height-constrained layout */}
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
        isPro={isPro}
      />
    )}

    {/* Mobile FAB */}
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
  </>
  )
}
