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
import ReactMarkdown from 'react-markdown'

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

function wordCount(t: string) { return t.trim() ? t.trim().split(/\s+/).length : 0 }

function timeAgo(s: string) {
  const d = Date.now() - new Date(s).getTime()
  if (d < 60_000) return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripMd(s: string) { return s.replace(/[#*>`_\-![\]()]/g, '').replace(/\s+/g, ' ').trim() }

export function StudyNotesPanel({ bookId, bookName, chapter, onClose, isAuthenticated }: Props) {
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // editor state
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const [title, setTitle] = useState('')
  const titleRef = useRef('')
  const [content, setContent] = useState('') // markdown string kept in sync with editor
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // synthesis state
  const [synthesis, setSynthesis] = useState('')
  const [synthesizing, setSynthesizing] = useState(false)
  const [showSynthesis, setShowSynthesis] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── save ────────────────────────────────────────────────
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
    } catch {
      setSaveState('unsaved')
    }
  }, [isAuthenticated])

  function scheduleSave(newTitle: string, newContent: string) {
    const id = activeIdRef.current
    if (!id) return
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(id, newTitle, newContent), 1200)
  }

  // ── Tiptap editor ────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ html: false, transformPastedText: true }),
      Placeholder.configure({ placeholder: 'Start writing, or drag a verse from the reader to quote it.' }),
    ],
    editorProps: {
      attributes: { class: 'h-full' },
    },
    onUpdate({ editor }) {
      const md = editor.storage.markdown.getMarkdown()
      setContent(md)
      scheduleSave(titleRef.current, md)
    },
  })

  // Sync title ref
  useEffect(() => { titleRef.current = title }, [title])

  // When active note changes → push content into editor
  useEffect(() => {
    if (!editor || view !== 'editor') return
    editor.commands.setContent(content, false)
    editor.commands.focus('end')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, editor])

  // ── load list ────────────────────────────────────────────
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

  // ── open / create ────────────────────────────────────────
  function openNote(note: Note) {
    activeIdRef.current = note.id
    setActiveId(note.id)
    setTitle(note.title)
    titleRef.current = note.title
    setContent(note.content)
    setSaveState('saved')
    setSavedAt(null)
    setShowSynthesis(false)
    setView('editor')
  }

  async function newNote(initialContent = '', initialTitle = 'Untitled Note') {
    if (!isAuthenticated) return
    try {
      const r = await fetch('/api/study-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: initialTitle,
          content: initialContent,
          book_id: bookId,
          chapter_number: chapter,
          book_name: bookName,
        }),
      })
      const d = await r.json()
      if (d.note) {
        setNotes(prev => [d.note, ...prev])
        openNote(d.note)
      }
    } catch { /* ignore */ }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/study-notes?id=${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    setView('list')
    setActiveId(null)
    activeIdRef.current = null
  }

  // ── toolbar commands ─────────────────────────────────────
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setTitle(val)
    titleRef.current = val
    scheduleSave(val, content)
  }

  // ── drag & drop ──────────────────────────────────────────
  function handleEditorDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const raw = e.dataTransfer.getData('verse')
    if (!raw || !editor) return
    const { text, ref } = JSON.parse(raw) as { text: string; ref: string }
    const quote = `\n\n> "${text}"\n> — *${ref}*\n\n`
    editor.commands.focus('end')
    editor.commands.insertContent(quote)
  }

  async function handleListDrop(e: React.DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer.getData('verse')
    if (!raw || !isAuthenticated) return
    const { text, ref } = JSON.parse(raw) as { text: string; ref: string }
    await newNote(`> "${text}"\n> — *${ref}*\n\n`, ref)
  }

  // ── synthesis ────────────────────────────────────────────
  async function synthesize() {
    if (!content.trim() || synthesizing) return
    setSynthesizing(true)
    setSynthesis('')
    setShowSynthesis(true)
    try {
      const res = await fetch('/api/synthesize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: content, bookName, chapter }),
      })
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}))
        setSynthesis(`**Daily limit reached**\n\n${d.error ?? 'Upgrade to Pro for unlimited AI note synthesis.'}`)
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
        setSynthesis(acc)
      }
    } catch { setSynthesis('Unable to synthesize. Please try again.') }
    setSynthesizing(false)
  }

  function applyAppend() {
    const current = editor?.storage.markdown.getMarkdown() ?? content
    const next = current.trimEnd() + '\n\n---\n\n' + synthesis
    editor?.commands.setContent(next, false)
    setContent(next)
    setShowSynthesis(false)
    scheduleSave(titleRef.current, next)
  }

  function applyReplace() {
    editor?.commands.setContent(synthesis, false)
    setContent(synthesis)
    setShowSynthesis(false)
    scheduleSave(titleRef.current, synthesis)
  }

  function fmtSavedAt(d: Date) {
    const ms = Date.now() - d.getTime()
    return ms < 60_000 ? 'just now' : `${Math.floor(ms / 60_000)}m ago`
  }

  const filtered = search.trim()
    ? notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()))
    : notes

  const words = wordCount(content)

  // ══════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════
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
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/40"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted-foreground/40 hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
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
              {search ? (
                <p className="text-xs text-muted-foreground/40 text-center">No notes match &ldquo;{search}&rdquo;</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground/40 text-center leading-relaxed">
                    No notes yet. Create one, or drag any verse here to start a new note automatically.
                  </p>
                  <button
                    onClick={() => newNote()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Create your first note
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(note => (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className="w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-1 flex-1">
                      {note.title || 'Untitled Note'}
                    </p>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5 tabular-nums">
                      {timeAgo(note.updated_at)}
                    </span>
                  </div>
                  {note.content && (
                    <p className="text-xs text-muted-foreground/55 mt-1 line-clamp-2 leading-relaxed">
                      {stripMd(note.content).slice(0, 140)}
                    </p>
                  )}
                  {note.book_name && note.chapter_number && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded-full">
                      <BookOpen className="w-2.5 h-2.5" />
                      {note.book_name} {note.chapter_number}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground/30">
            {notes.length > 0
              ? `${notes.length} note${notes.length === 1 ? '' : 's'} · drag a verse here to create a note`
              : 'Drag a verse from the reader to start a note'}
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: 'system-ui' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        <button
          onClick={() => { clearTimeout(saveTimer.current); loadNotes(); setView('list') }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
          title="Back to notes"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title…"
          className="flex-1 text-sm font-semibold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/30 min-w-0"
        />

        <div className="flex items-center gap-2 shrink-0">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Clock className="w-2.5 h-2.5" /> saving…
            </span>
          )}
          {saveState === 'saved' && savedAt && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500/80">
              <Check className="w-2.5 h-2.5" /> saved {fmtSavedAt(savedAt)}
            </span>
          )}
          {saveState === 'unsaved' && (
            <span className="text-[10px] text-amber-500/80">unsaved</span>
          )}
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border shrink-0">
        <ToolBtn title="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
          <span className="font-bold text-sm">B</span>
        </ToolBtn>
        <ToolBtn title="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
          <span className="italic text-sm">I</span>
        </ToolBtn>
        <ToolBtn title="Heading" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}>
          <span className="text-[11px] font-bold tracking-tight">H</span>
        </ToolBtn>
        <ToolBtn title="Blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}>
          <span className="text-base leading-none font-serif">&ldquo;</span>
        </ToolBtn>
        <ToolBtn title="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
          <span className="text-sm leading-none">•</span>
        </ToolBtn>
        <ToolBtn title="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>

        <div className="flex-1" />

        <button
          onClick={() => activeId && deleteNote(activeId)}
          className="text-[11px] text-muted-foreground/40 hover:text-destructive transition-colors px-1.5 py-1 rounded"
          title="Delete this note"
        >
          Delete
        </button>
      </div>

      {/* Editor */}
      <div
        className={`flex-1 overflow-y-auto note-editor transition-colors ${dragOver ? 'bg-primary/5' : ''}`}
        onDrop={handleEditorDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => editor?.commands.focus()}
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

      {/* Synthesis panel */}
      {showSynthesis && (
        <div className="border-t border-border shrink-0 flex flex-col overflow-hidden" style={{ maxHeight: '42%' }}>
          <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-border shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Connections</span>
              {synthesizing && <span className="text-[10px] text-primary/50 font-mono">generating…</span>}
            </div>
            <button onClick={() => setShowSynthesis(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-3 flex-1">
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground/80 text-xs leading-relaxed">
              {synthesizing && !synthesis
                ? <span className="text-muted-foreground/40 animate-pulse">Thinking…</span>
                : <ReactMarkdown>{synthesis}</ReactMarkdown>}
            </div>
          </div>
          {!synthesizing && synthesis && (
            <div className="flex gap-2 px-4 py-2.5 border-t border-border shrink-0 bg-muted/30">
              <p className="text-[10px] text-muted-foreground/50 flex-1 self-center">Add this to your notes?</p>
              <button onClick={applyAppend} className="text-[11px] px-2.5 py-1 rounded border border-border bg-background text-foreground hover:bg-muted/60 transition-colors">Add below</button>
              <button onClick={applyReplace} className="text-[11px] px-2.5 py-1 rounded border border-border bg-background text-foreground hover:bg-muted/60 transition-colors">Replace notes</button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/40">
          {words > 0 ? `${words} word${words === 1 ? '' : 's'}` : 'Drag verses to quote them'}
        </span>
        <Button size="sm" className="h-7 px-3 text-xs gap-1.5" onClick={synthesize} disabled={!content.trim() || synthesizing}>
          <Sparkles className="w-3 h-3" />
          {synthesizing ? 'Synthesizing…' : 'Get AI Connections'}
        </Button>
      </div>
    </div>
  )
}

function ToolBtn({ children, title, onClick, active }: {
  children: React.ReactNode
  title: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors
        ${active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
    >
      {children}
    </button>
  )
}
