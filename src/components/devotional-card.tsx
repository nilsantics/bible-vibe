'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import { ChevronDown, ChevronUp, BookHeart } from 'lucide-react'

interface Props {
  bookId: number
  chapter: number
  verse: number
  verseRef: string
}

export function DevotionalCard({ bookId, chapter, verse, verseRef }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  async function load() {
    if (fetched) return
    setFetched(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/devotional?book_id=${bookId}&chapter=${chapter}&verse=${verse}`)
      if (!res.ok || !res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setText(acc)
      }
    } catch {
      setText('Unable to load devotional. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) load()
  }

  return (
    <Card className="border-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={toggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <BookHeart className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>Daily Devotional</p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Based on {verseRef} · ~3 min read
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4">
            {!text && loading ? (
              <div className="space-y-2">
                {[100, 85, 92, 78, 88, 60, 95, 70, 82].map((w, i) => (
                  <div
                    key={i}
                    className="h-2.5 bg-muted rounded animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-sm [&>p]:mb-3 [&>p:last-child]:mb-0 [&>strong]:font-semibold [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-1.5 [&>h2]:mt-4 [&>h2:first-child]:mt-0">
                <ReactMarkdown>{text}</ReactMarkdown>
                {loading && (
                  <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
