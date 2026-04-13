'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Sparkles, GripVertical, Bold, Italic, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

interface Props {
  bookId: number
  bookName: string
  chapter: number
  onClose: () => void
  isAuthenticated: boolean
}

export function StudyNotesPanel({ bookId, bookName, chapter, onClose, isAuthenticated }: Props) {
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [synthesis, setSynthesis] = useState('')
  const [synthesizing, setSynthesizing] = useState(false)
  const [showSynthesis, setShowSynthesis] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Load note for this chapter
  useEffect(() => {
    if (!isAuthenticated) return
    setContent('')
    setSaveState('saved')
    setSavedAt(null)
    fetch(`/api/study-notes?book_id=${bookId}&chapter=${chapter}`)
      .then((r) => r.json())
      .then((d) => { if (d.note) setContent(d.note.content) })
      .catch(() => {})
  }, [bookId, chapter, isAuthenticated])

  const save = useCallback(async (text: string) => {
    if (!isAuthenticated) return
    setSaveState('saving')
    try {
      await fetch('/api/study-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, chapter_number: chapter, content: text }),
      })
      setSaveState('saved')
      setSavedAt(new Date())
    } catch {
      setSaveState('unsaved')
    }
  }, [bookId, chapter, isAuthenticated])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(e.target.value), 1200)
  }

  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const next = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(next)
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(next), 1200)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const raw = e.dataTransfer.getData('verse')
    if (!raw) return
    const { text, ref } = JSON.parse(raw) as { text: string; ref: string }
    const quote = `> "${text}"\n> — *${ref}*\n\n`
    const ta = textareaRef.current
    const pos = ta?.selectionStart ?? content.length
    const next = content.slice(0, pos) + (pos > 0 && content[pos - 1] !== '\n' ? '\n\n' : '') + quote + content.slice(pos)
    setContent(next)
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(next), 1200)
    setTimeout(() => {
      if (ta) { ta.focus(); ta.setSelectionRange(pos + quote.length, pos + quote.length) }
    }, 0)
  }

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
      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setSynthesis(acc)
      }
    } catch {
      setSynthesis('Unable to synthesize. Please try again.')
    }
    setSynthesizing(false)
  }

  function applyAppend() {
    const next = content.trimEnd() + '\n\n---\n\n' + synthesis
    setContent(next)
    setSaveState('unsaved')
    setShowSynthesis(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(next), 1200)
  }

  function applyReplace() {
    setContent(synthesis)
    setSaveState('unsaved')
    setShowSynthesis(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(synthesis), 1200)
  }

  function formatSavedAt(d: Date) {
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    if (diffMs < 60_000) return 'just now'
    const mins = Math.floor(diffMs / 60_000)
    return `${mins}m ago`
  }

  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: 'system-ui' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <p className="text-sm font-semibold">Study Notes</p>
          <p className="text-xs text-muted-foreground">{bookName} {chapter}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Save state */}
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-mono">
              <Clock className="w-2.5 h-2.5" />
              saving…
            </span>
          )}
          {saveState === 'saved' && savedAt && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500/70 font-mono">
              <Check className="w-2.5 h-2.5" />
              saved {formatSavedAt(savedAt)}
            </span>
          )}
          {saveState === 'unsaved' && (
            <span className="text-[10px] text-amber-500/70 font-mono">unsaved</span>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border shrink-0">
        <button
          onMouseDown={(e) => { e.preventDefault(); wrapSelection('**', '**') }}
          title="Bold (wrap selection)"
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-bold text-sm"
        >
          B
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); wrapSelection('*', '*') }}
          title="Italic (wrap selection)"
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors italic text-sm"
        >
          I
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <span className="text-[10px] text-muted-foreground/30">Drag verses from the reader to quote them</span>
      </div>

      {/* Notes textarea — TOP */}
      <div
        className={`flex-1 overflow-y-auto relative transition-colors ${dragOver ? 'bg-primary/5' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2">
              <GripVertical className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Drop to quote verse</span>
            </div>
          </div>
        )}

        {!content && !dragOver && (
          <div className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none">
            <p className="text-xs text-muted-foreground/40 leading-relaxed text-center">
              {isAuthenticated
                ? 'Write your notes here. Drag any verse from the reader to quote it.'
                : 'Sign in to save study notes.'}
            </p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder=""
          disabled={!isAuthenticated}
          className="w-full h-full min-h-full resize-none bg-transparent px-4 py-4 text-sm leading-relaxed outline-none text-foreground disabled:cursor-not-allowed"
        />
      </div>

      {/* Synthesis result panel — BOTTOM */}
      {showSynthesis && (
        <div className="border-t border-border shrink-0 flex flex-col overflow-hidden" style={{ maxHeight: '42%' }}>
          {/* Synthesis header */}
          <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-border shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Connections</span>
              {synthesizing && (
                <span className="text-[10px] text-primary/50 font-mono">generating…</span>
              )}
            </div>
            <button
              onClick={() => setShowSynthesis(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Synthesis content */}
          <div className="overflow-y-auto px-4 py-3 flex-1">
            <div className="prose prose-sm max-w-none text-foreground/80 text-xs leading-relaxed">
              {synthesizing && !synthesis
                ? <span className="text-muted-foreground/40 animate-pulse">Thinking…</span>
                : <ReactMarkdown>{synthesis}</ReactMarkdown>
              }
            </div>
          </div>

          {/* Append / Replace — only shown when done */}
          {!synthesizing && synthesis && (
            <div className="flex gap-2 px-4 py-2.5 border-t border-border shrink-0 bg-muted/30">
              <p className="text-[10px] text-muted-foreground/50 flex-1 self-center">Add this to your notes?</p>
              <button
                onClick={applyAppend}
                className="text-[11px] px-2.5 py-1 rounded border border-border bg-background text-foreground hover:bg-muted/60 transition-colors"
                title="Paste the AI connections below your existing notes"
              >
                Add below
              </button>
              <button
                onClick={applyReplace}
                className="text-[11px] px-2.5 py-1 rounded border border-border bg-background text-foreground hover:bg-muted/60 transition-colors"
                title="Replace your notes with the AI connections"
              >
                Replace notes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border shrink-0 flex items-center justify-end">
        <Button
          size="sm"
          className="h-7 px-3 text-xs gap-1.5"
          onClick={synthesize}
          disabled={!content.trim() || synthesizing || !isAuthenticated}
        >
          <Sparkles className="w-3 h-3" />
          {synthesizing ? 'Synthesizing…' : 'Get AI Connections'}
        </Button>
      </div>
    </div>
  )
}
