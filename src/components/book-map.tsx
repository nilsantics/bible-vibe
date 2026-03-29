'use client'

import Link from 'next/link'
import { BIBLE_BOOKS } from '@/lib/bible-data'

interface BookMeta {
  id: number
  name: string
  abbr: string
  testament: string
  chapters: number
  order: number
}

interface Props {
  bookProgress: Record<number, number> // book_id → chapters read
}

function getTileClass(chaptersRead: number, total: number) {
  if (chaptersRead === 0) return 'bg-muted text-muted-foreground/50'
  const pct = chaptersRead / total
  if (pct >= 1) return 'bg-green-500 dark:bg-green-600 text-white'
  if (pct >= 0.67) return 'bg-amber-500 text-white'
  if (pct >= 0.33) return 'bg-amber-400/80 dark:bg-amber-600/60 text-foreground dark:text-white'
  return 'bg-amber-200 dark:bg-amber-900/70 text-foreground'
}

function BookGrid({ books, bookProgress }: { books: BookMeta[]; bookProgress: Record<number, number> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {books.map((book) => {
        const read = bookProgress[book.id] ?? 0
        const tileClass = getTileClass(read, book.chapters)
        const pct = Math.round((read / book.chapters) * 100)
        return (
          <Link
            key={book.id}
            href={`/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/1`}
            title={`${book.name}: ${read}/${book.chapters} chapters${read > 0 ? ` (${pct}%)` : ''}`}
            className={`${tileClass} rounded-md flex items-center justify-center shrink-0 hover:opacity-75 transition-opacity`}
            style={{ width: 36, height: 38 }}
          >
            <span className="text-[9px] font-bold leading-none text-center px-0.5 select-none">
              {book.abbr}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export function BookMap({ bookProgress }: Props) {
  const otBooks = BIBLE_BOOKS.filter((b) => b.testament === 'Old') as BookMeta[]
  const ntBooks = BIBLE_BOOKS.filter((b) => b.testament === 'New') as BookMeta[]

  const otDone = otBooks.filter((b) => (bookProgress[b.id] ?? 0) >= b.chapters).length
  const ntDone = ntBooks.filter((b) => (bookProgress[b.id] ?? 0) >= b.chapters).length

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
            Old Testament
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {otDone}/39 complete
          </p>
        </div>
        <BookGrid books={otBooks} bookProgress={bookProgress} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
            New Testament
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {ntDone}/27 complete
          </p>
        </div>
        <BookGrid books={ntBooks} bookProgress={bookProgress} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1" style={{ fontFamily: 'system-ui' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span>Unread</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/70" />
          <span>Started</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span>Mostly done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Complete</span>
        </div>
      </div>
    </div>
  )
}
