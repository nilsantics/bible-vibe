'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Bookmark, ChevronRight, Search } from 'lucide-react'
import type { BIBLE_BOOKS } from '@/lib/bible-data'

type Book = typeof BIBLE_BOOKS[number]

interface BookmarkItem {
  id: string
  folder: string
  created_at: string
  verse: { id: number; book_id: number; chapter_number: number; verse_number: number; text: string }
  book: Book
}

export function BookmarksClient({ items }: { items: BookmarkItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? items.filter((b) =>
        b.verse.text.toLowerCase().includes(query.toLowerCase()) ||
        b.book.name.toLowerCase().includes(query.toLowerCase())
      )
    : items

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Bookmark className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Bookmarks
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'system-ui' }}>
        {items.length} saved verse{items.length !== 1 ? 's' : ''}
      </p>

      {items.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {items.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1" style={{ fontFamily: 'system-ui' }}>No bookmarks yet</p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            Tap any verse while reading to bookmark it here.
          </p>
          <Link href="/dashboard/reading/genesis/1" className="inline-block mt-4 text-sm text-primary hover:underline" style={{ fontFamily: 'system-ui' }}>
            Start reading &rarr;
          </Link>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12" style={{ fontFamily: 'system-ui' }}>
          No bookmarks match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((bookmark) => {
            const href = `/dashboard/reading/${bookmark.book.name.toLowerCase().replace(/\s+/g, '-')}/${bookmark.verse.chapter_number}`
            return (
              <Link key={bookmark.id} href={href}>
                <Card className="p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bookmark className="w-3.5 h-3.5 text-primary fill-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground mb-1" style={{ fontFamily: 'system-ui' }}>
                        {bookmark.book.name} {bookmark.verse.chapter_number}:{bookmark.verse.verse_number}
                      </p>
                      <p className="bible-text text-sm leading-relaxed line-clamp-3">{bookmark.verse.text}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
