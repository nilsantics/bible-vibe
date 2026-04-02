'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, BookOpen, FileText } from 'lucide-react'
import { BIBLE_BOOKS } from '@/lib/bible-data'

interface NoteWithVerse {
  id: string
  content: string
  created_at: string
  verse_id: number
  verses: {
    book_id: number
    chapter_number: number
    verse_number: number
  } | null
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteWithVerse[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = query.trim()
    ? notes.filter((n) => n.content.toLowerCase().includes(query.toLowerCase()))
    : notes

  // Group by book, preserving canonical order
  const grouped: Record<number, NoteWithVerse[]> = {}
  for (const note of filtered) {
    const bookId = note.verses?.book_id
    if (bookId !== undefined) {
      if (!grouped[bookId]) grouped[bookId] = []
      grouped[bookId].push(note)
    }
  }
  const sortedBookIds = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => {
      const ba = BIBLE_BOOKS.find((bk) => bk.id === a)
      const bb = BIBLE_BOOKS.find((bk) => bk.id === b)
      return (ba?.order ?? 99) - (bb?.order ?? 99)
    })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          My Notes
        </h1>
        {!loading && notes.length > 0 && (
          <span className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      {/* Search */}
      {notes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your notes…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-medium text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            No notes yet
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-5" style={{ fontFamily: 'system-ui' }}>
            Tap any verse while reading, then add a study note.
          </p>
          <Link href="/dashboard/reading/genesis/1">
            <Button variant="outline" size="sm">Start reading</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            No notes match &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedBookIds.map((bookId) => {
            const book = BIBLE_BOOKS.find((b) => b.id === bookId)
            if (!book) return null
            const bookNotes = grouped[bookId]
            return (
              <div key={bookId}>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  <h2 className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>
                    {book.name}
                  </h2>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    {bookNotes.length} {bookNotes.length === 1 ? 'note' : 'notes'}
                  </span>
                </div>
                <div className="space-y-2 ml-5">
                  {bookNotes.map((note) => {
                    const v = note.verses
                    const ref = v
                      ? `${book.name} ${v.chapter_number}:${v.verse_number}`
                      : 'Unknown verse'
                    const href = v
                      ? `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${v.chapter_number}#v${v.verse_number}`
                      : '#'
                    return (
                      <Card key={note.id} className="p-4">
                        <Link
                          href={href}
                          className="text-xs text-primary font-semibold hover:underline block mb-2"
                          style={{ fontFamily: 'system-ui' }}
                        >
                          {ref} →
                        </Link>
                        <p className="text-sm leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                          {note.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: 'system-ui' }}>
                          {new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
