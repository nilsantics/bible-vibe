'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import {
  X, Sparkles, GripVertical, Check, Clock,
  Minus, Plus, ArrowLeft, BookOpen, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BIBLE_BOOKS } from '@/lib/bible-data'

interface Note {
  id: string
  title: string
  content: string
  book_id: number | null
  book_name: string | null
  chapter_number: number | null
  updated_at: string
  created_at: string
}

interface Props {
  bookId: number
  bookName: string
  chapter: number
  onClose: () => void
  isAuthenticated: boolean
}

// ── helpers ──────────────────────────────────────────────────────────────────

function wordCount(t: string) { return t.trim() ? t.trim().split(/\s+/).length : 0 }

function timeAgo(s: string) {
  const d = Date.now() - new Date(s).getTime()
  if (d < 60_000) return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripMd(s: string) {
  return s.replace(/[#*>`_\-![\]()]/g, '').replace(/\s+/g, ' ').trim()
}

// ── slash commands ────────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { id: 'h2',        label: 'Heading',     desc: 'Large section title',    icon: 'H',  keys: ['h', 'heading', 'h2'] },
  { id: 'blockquote',label: 'Quote',       desc: 'Indented pull quote',    icon: '"',  keys: ['q', 'quote'] },
  { id: 'bulletList',label: 'Bullet list', desc: 'Unordered list',         icon: '•',  keys: ['l', 'list', 'bullet', 'ul'] },
  { id: 'hr',        label: 'Divider',     desc: 'Horizontal rule',        icon: '—',  keys: ['-', '--', '---', 'hr', 'div', 'divider'] },
]

function matchSlashCommands(query: string) {
  if (!query) return SLASH_COMMANDS
  const q = query.toLowerCase()
  return SLASH_COMMANDS.filter(c =>
    c.keys.some(k => k.startsWith(q)) || c.label.toLowerCase().startsWith(q)
  )
}

// Parse "john3:16", "john 3:16", "1john3:16", "1 Sam 3:1" etc.
function parseVerseRef(query: string) {
  const m = query.match(/^(\d?\s*[a-zA-Z]+)\s*(\d+):(\d+)$/)
  if (!m) return null
  return { bookQuery: m[1].trim(), chapter: parseInt(m[2]), verse: parseInt(m[3]) }
}

function findBook(query: string) {
  const q = query.toLowerCase().replace(/\s+/g, '')
  return BIBLE_BOOKS.find(b => {
    const name = b.name.toLowerCase().replace(/\s+/g, '')
    const abbr = b.abbr.toLowerCase().replace(/\s+/g, '')
    return name.startsWith(q) || abbr === q || name === q
  })
}

// ── synthesis sections ────────────────────────────────────────────────────────

interface SynthesisSection { title: string; content: string; inserted: boolean }

function parseSections(text: string): SynthesisSection[] {
  const parts = text.split(/^## /m).filter(p => p.trim())
  if (parts.length === 0) return [{ title: 'AI Connections', content: text.trim(), inserted: false }]
  return parts.map(p => {
    const lines = p.split('\n')
    return { title: lines[0].trim(), content: lines.slice(1).join('\n').trim(), inserted: false }
  })
}

// ── main component ────────────────────────────────────────────────────────────

export function StudyNotesPanel({ bookId, bookName, chapter, onClose, isAuthenticated }: Props) {
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const [title, setTitle] = useState('')
  const titleRef = useRef('')
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [synthesizing, setSynthesizing] = useState(false)
  const [showSynthesis, setShowSynthesis] = useState(false)
  const [sections, setSections] = useState<SynthesisSection[]>([])
  const [synthStream, setSynthStream] = useState('')

  // slash menu
  const [slashMenu, setSlashMenu] = useState<{ query: string; top: number; left: number } | null>(null)
  const [slashIdx, setSlashIdx] = useState(0)
  const [fetchingVerse, setFetchingVerse] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── save ─────────────────────────────────────────────────────────────────

  const save = useCallback(async (id: string, t: string, c: string) => {
    if (!isAuthenticated) return
    setSaveState('saving')
    try {
      const r = await fetch('/api/study-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: t, content: c }),
      })
      const d = await r.json()
      if (d.note) setNotes(prev => prev.map(n => n.id === id ? d.note : n))
      setSaveState('saved')
      setSavedAt(new Date())
    } catch { setSaveState('unsaved') }
  }, [isAuthenticated])

  function scheduleSave(t: string, c: string) {
    const id = activeIdRef.current
    if (!id) return
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(id, t, c), 1200)
  }

  // ── editor ────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ html: false, transformPastedText: true }),
      Placeholder.configure({ placeholder: 'Start writing… type / for commands' }),
    ],
    onUpdate({ editor }) {
      const md = (editor.storage as any).markdown.getMarkdown()
      setContent(md)
      scheduleSave(titleRef.current, md)

      // detect slash command at start of paragraph
      const { from } = editor.state.selection
      try {
        const $from = editor.state.doc.resolve(from)
        const paraStart = $from.start()
        const paraText = editor.state.doc.textBetween(paraStart, from)
        if (paraText.startsWith('/')) {
          const query = paraText.slice(1)
          const coords = editor.view.coordsAtPos(from)
          setSlashMenu({ query, top: coords.bottom + 6, left: Math.max(coords.left, 8) })
          setSlashIdx(0)
        } else {
          setSlashMenu(null)
        }
      } catch { setSlashMenu(null) }
    },
  })

  useEffect(() => { titleRef.current = title }, [title])

  useEffect(() => {
    if (!editor || view !== 'editor') return
    editor.commands.setContent(content)
    setTimeout(() => editor.commands.focus('end'), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, editor])

  // slash keyboard nav
  useEffect(() => {
    if (!slashMenu) return
    const matched = matchSlashCommands(slashMenu.query)
    const verseRef = parseVerseRef(slashMenu.query)
    const total = matched.length + (verseRef ? 1 : 0)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => (i + 1) % total) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(i => (i - 1 + total) % total) }
      else if (e.key === 'Enter') { e.preventDefault(); triggerSlashItem(slashIdx, matched, verseRef) }
      else if (e.key === 'Escape') { e.preventDefault(); setSlashMenu(null); editor?.commands.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slashMenu, slashIdx, editor])

  function deleteSlashText() {
    if (!editor) return
    const { from } = editor.state.selection
    try {
      const $from = editor.state.doc.resolve(from)
      const paraStart = $from.start()
      editor.chain().deleteRange({ from: paraStart, to: from }).run()
    } catch { /* ignore */ }
  }

  function triggerSlashItem(
    idx: number,
    matched: typeof SLASH_COMMANDS,
    verseRef: ReturnType<typeof parseVerseRef>
  ) {
    if (!editor) return
    const isVerseSlot = verseRef && idx === matched.length
    if (isVerseSlot) {
      runVerseInsert(verseRef!)
    } else {
      const cmd = matched[idx]
      if (!cmd) return
      runSlashCommand(cmd.id)
    }
    setSlashMenu(null)
  }

  function runSlashCommand(id: string) {
    if (!editor) return
    deleteSlashText()
    switch (id) {
      case 'h2':         editor.chain().focus().toggleHeading({ level: 2 }).run(); break
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break
      case 'hr':         editor.chain().focus().setHorizontalRule().run(); break
    }
  }

  async function runVerseInsert(ref: { bookQuery: string; chapter: number; verse: number }) {
    if (!editor) return
    const book = findBook(ref.bookQuery)
    if (!book) return
    deleteSlashText()
    setFetchingVerse(true)
    try {
      const r = await fetch(`/api/verses?book=${book.id}&chapter=${ref.chapter}&translation=WEB`)
      const d = await r.json()
      const v = d.verses?.find((v: { verse_number: number }) => v.verse_number === ref.verse)
      if (!v) return
      const verseRef = `${book.name} ${ref.chapter}:${ref.verse}`
      editor.commands.insertContent({
        type: 'blockquote',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: `"${v.text}"` }] },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '— ' },
              { type: 'text', marks: [{ type: 'italic' }], text: verseRef },
            ],
          },
        ],
      })
    } catch { /* ignore */ }
    setFetchingVerse(false)
    editor.commands.focus()
  }

  // ── drag & drop ───────────────────────────────────────────────────────────

  function insertVerseQuote(text: string, ref: string) {
    if (!editor) return
    editor.commands.focus()
    editor.commands.insertContent({
      type: 'blockquote',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: `"${text}"` }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '— ' },
            { type: 'text', marks: [{ type: 'italic' }], text: ref },
          ],
        },
      ],
    })
  }

  function handleEditorDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const raw = e.dataTransfer.getData('verse')
    if (!raw) return
    const { text, ref } = JSON.parse(raw) as { text: string; ref: string }
    insertVerseQuote(text, ref)
  }

  async function handleListDrop(e: React.DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer.getData('verse')
    if (!raw || !isAuthenticated) return
    const { text, ref } = JSON.parse(raw) as { text: string; ref: string }
    await newNote(`> "${text}"\n> — *${ref}*\n\n`, ref)
  }

  // ── notes list CRUD ───────────────────────────────────────────────────────

  const loadNotes = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const r = await fetch('/api/study-notes')
      const d = await r.json()
      setNotes(d.notes ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [isAuthenticated])

  useEffect(() => { loadNotes() }, [loadNotes])

  function openNote(note: Note) {
    activeIdRef.current = note.id
    setActiveId(note.id)
    setTitle(note.title)
    titleRef.current = note.title
    setContent(note.content)
    setSaveState('saved')
    setSavedAt(null)
    setShowSynthesis(false)
    setSections([])
    setView('editor')
  }

  async function newNote(initialContent = '', initialTitle = 'Untitled Note') {
    if (!isAuthenticated) return
    const r = await fetch('/api/study-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: initialTitle, content: initialContent, book_id: bookId, chapter_number: chapter, book_name: bookName }),
    })
    const d = await r.json()
    if (d.note) { setNotes(prev => [d.note, ...prev]); openNote(d.note) }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/study-notes?id=${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    setView('list')
    setActiveId(null)
    activeIdRef.current = null
  }

  // ── synthesis ─────────────────────────────────────────────────────────────

  async function synthesize() {
    if (!content.trim() || synthesizing) return
    setSynthesizing(true)
    setSynthStream('')
    setSections([])
    setShowSynthesis(true)
    try {
      const res = await fetch('/api/synthesize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: content, bookName, chapter }),
      })
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}))
        setSections([{ title: 'Limit reached', content: d.error ?? 'Upgrade to Pro for unlimited synthesis.', inserted: false }])
        setSynthesizing(false)
        return
      }
      if (!res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setSynthStream(acc)
      }
      setSections(parseSections(acc))
    } catch {
      setSections([{ title: 'Error', content: 'Unable to synthesize. Please try again.', inserted: false }])
    }
    setSynthesizing(false)
  }

  function insertSection(idx: number) {
    const section = sections[idx]
    if (!section || !editor) return
    const md = `\n\n## ${section.title}\n\n${section.content}`
    const current = (editor.storage as any).markdown.getMarkdown()
    editor.commands.setContent(current.trimEnd() + md)
    editor.commands.focus('end')
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, inserted: true } : s))
  }

  function insertAllSections() {
    if (!editor) return
    const pending = sections.filter(s => !s.inserted)
    const md = pending.map(s => `\n\n## ${s.title}\n\n${s.content}`).join('')
    const current = (editor.storage as any).markdown.getMarkdown()
    editor.commands.setContent(current.trimEnd() + md)
    editor.commands.focus('end')
    setSections(prev => prev.map(s => ({ ...s, inserted: true })))
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  function fmtSaved(d: Date) {
    const ms = Date.now() - d.getTime()
    return ms < 60_000 ? 'just now' : `${Math.floor(ms / 60_000)}m ago`
  }

  const filtered = search.trim()
    ? notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()))
    : notes

  const slashMatched = slashMenu ? matchSlashCommands(slashMenu.query) : []
  const slashVerseRef = slashMenu ? parseVerseRef(slashMenu.query) : null
  const slashBook = slashVerseRef ? findBook(slashVerseRef.bookQuery) : null

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full bg-background" style={{ fontFamily: 'system-ui' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <p className="text-sm font-semibold">My Notes</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => newNote()}
              disabled={!isAuthenticated}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 font-medium"
            >
              <Plus className="w-3 h-3" /> New Note
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {notes.length > 2 && (
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Search className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/40" />
              {search && <button onClick={() => setSearch('')} className="text-muted-foreground/40 hover:text-foreground"><X className="w-3 h-3" /></button>}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto" onDrop={handleListDrop} onDragOver={e => e.preventDefault()}>
          {!isAuthenticated ? (
            <div className="flex items-center justify-center h-full px-8">
              <p className="text-xs text-muted-foreground/40 text-center">Sign in to save and access your notes.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground/30 animate-pulse">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
              {search
                ? <p className="text-xs text-muted-foreground/40 text-center">No notes match &ldquo;{search}&rdquo;</p>
                : <>
                    <p className="text-xs text-muted-foreground/40 text-center leading-relaxed">
                      No notes yet. Create one, or drag any verse here to start a new note.
                    </p>
                    <button onClick={() => newNote()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="w-3 h-3" /> Create your first note
                    </button>
                  </>
              }
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(note => (
                <button key={note.id} onClick={() => openNote(note)} className="w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-1 flex-1">{note.title || 'Untitled Note'}</p>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5 tabular-nums">{timeAgo(note.updated_at)}</span>
                  </div>
                  {note.content && (
                    <p className="text-xs text-muted-foreground/55 mt-1 line-clamp-2 leading-relaxed">{stripMd(note.content).slice(0, 140)}</p>
                  )}
                  {note.book_name && note.chapter_number && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded-full">
                      <BookOpen className="w-2.5 h-2.5" />{note.book_name} {note.chapter_number}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground/30">
            {notes.length > 0 ? `${notes.length} note${notes.length === 1 ? '' : 's'} · drag a verse here to create a note` : 'Drag a verse from the reader to start a note'}
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: 'system-ui' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        <button
          onClick={() => { clearTimeout(saveTimer.current); loadNotes(); setView('list') }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); titleRef.current = e.target.value; scheduleSave(e.target.value, content) }}
          placeholder="Note title…"
          className="flex-1 text-sm font-semibold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/30 min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          {saveState === 'saving' && <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50"><Clock className="w-2.5 h-2.5" /> saving…</span>}
          {saveState === 'saved' && savedAt && <span className="flex items-center gap-1 text-[10px] text-emerald-500/80"><Check className="w-2.5 h-2.5" /> saved {fmtSaved(savedAt)}</span>}
          {saveState === 'unsaved' && <span className="text-[10px] text-amber-500/80">unsaved</span>}
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border shrink-0">
        <ToolBtn title="Bold"        onClick={() => editor?.chain().focus().toggleBold().run()}               active={editor?.isActive('bold')}>        <span className="font-bold text-sm">B</span></ToolBtn>
        <ToolBtn title="Italic"      onClick={() => editor?.chain().focus().toggleItalic().run()}             active={editor?.isActive('italic')}>      <span className="italic text-sm">I</span></ToolBtn>
        <ToolBtn title="Heading"     onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}><span className="text-[11px] font-bold">H</span></ToolBtn>
        <ToolBtn title="Blockquote"  onClick={() => editor?.chain().focus().toggleBlockquote().run()}         active={editor?.isActive('blockquote')}><span className="text-base leading-none font-serif">&ldquo;</span></ToolBtn>
        <ToolBtn title="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()}         active={editor?.isActive('bulletList')}><span className="text-sm">•</span></ToolBtn>
        <ToolBtn title="Divider"     onClick={() => editor?.chain().focus().setHorizontalRule().run()}>       <Minus className="w-3.5 h-3.5" /></ToolBtn>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground/30 mr-1">/ for commands</span>
        <button
          onClick={() => activeId && deleteNote(activeId)}
          className="text-[11px] text-muted-foreground/40 hover:text-destructive transition-colors px-1.5 py-1 rounded"
        >
          Delete
        </button>
      </div>

      {/* Editor */}
      <div
        className={`flex-1 overflow-y-auto note-editor relative transition-colors ${dragOver ? 'bg-primary/5' : ''}`}
        onDrop={handleEditorDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => { editor?.commands.focus(); setSlashMenu(null) }}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2">
              <GripVertical className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Drop to quote verse</span>
            </div>
          </div>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Slash command menu */}
      {slashMenu && (slashMatched.length > 0 || slashBook) && (
        <div
          className="fixed z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1"
          style={{ top: slashMenu.top, left: slashMenu.left, minWidth: 220, maxWidth: 300 }}
          onMouseDown={e => e.preventDefault()}
        >
          {slashMatched.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => { runSlashCommand(cmd.id); setSlashMenu(null) }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${slashIdx === i ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'}`}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded bg-muted text-xs font-bold shrink-0">{cmd.icon}</span>
              <div>
                <p className="text-xs font-medium">{cmd.label}</p>
                <p className="text-[10px] text-muted-foreground">{cmd.desc}</p>
              </div>
            </button>
          ))}
          {slashBook && slashVerseRef && (
            <button
              onClick={() => { runVerseInsert(slashVerseRef!); setSlashMenu(null) }}
              disabled={fetchingVerse}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${slashIdx === slashMatched.length ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'}`}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded bg-muted text-xs font-bold shrink-0">
                <BookOpen className="w-3 h-3" />
              </span>
              <div>
                <p className="text-xs font-medium">{fetchingVerse ? 'Looking up…' : `Insert ${slashBook.name} ${slashVerseRef.chapter}:${slashVerseRef.verse}`}</p>
                <p className="text-[10px] text-muted-foreground">Paste verse as a quote block</p>
              </div>
            </button>
          )}
          {slashMenu.query && slashMatched.length === 0 && !slashBook && (
            <p className="text-[11px] text-muted-foreground/50 px-3 py-2">No commands match. Try a verse like <span className="font-mono">john3:16</span></p>
          )}
        </div>
      )}

      {/* AI Connections panel */}
      {showSynthesis && (
        <div className="border-t border-border shrink-0 flex flex-col overflow-hidden" style={{ maxHeight: '48%' }}>
          <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-border shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Connections</span>
              {synthesizing && <span className="text-[10px] text-primary/50 font-mono animate-pulse">generating…</span>}
            </div>
            <div className="flex items-center gap-2">
              {!synthesizing && sections.length > 1 && sections.some(s => !s.inserted) && (
                <button onClick={insertAllSections} className="text-[11px] text-primary/70 hover:text-primary transition-colors">
                  Insert all
                </button>
              )}
              <button onClick={() => setShowSynthesis(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {synthesizing && sections.length === 0 ? (
              <div className="space-y-2 pt-1">
                {[90, 75, 85, 60].map((w, i) => (
                  <div key={i} className="h-2.5 bg-muted rounded animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : sections.map((section, i) => (
              <div
                key={i}
                className={`rounded-lg border transition-all ${
                  section.inserted
                    ? 'border-border bg-muted/20 opacity-50'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
                  <span className="text-[11px] font-semibold text-foreground/80">{section.title}</span>
                  {section.inserted ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500/70"><Check className="w-3 h-3" /> Added</span>
                  ) : (
                    <button
                      onClick={() => insertSection(i)}
                      className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:text-foreground transition-colors font-medium"
                    >
                      <Plus className="w-3 h-3" /> Insert
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed px-3 py-2 line-clamp-3">
                  {stripMd(section.content).slice(0, 200)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/40">
          {wordCount(content) > 0 ? `${wordCount(content)} words` : 'type / for commands · drag verses to quote'}
        </span>
        <Button size="sm" className="h-7 px-3 text-xs gap-1.5" onClick={synthesize} disabled={!content.trim() || synthesizing}>
          <Sparkles className="w-3 h-3" />
          {synthesizing ? 'Thinking…' : 'AI Connections'}
        </Button>
      </div>
    </div>
  )
}

function ToolBtn({ children, title, onClick, active }: {
  children: React.ReactNode; title: string; onClick: () => void; active?: boolean
}) {
  return (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors
        ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
    >
      {children}
    </button>
  )
}
