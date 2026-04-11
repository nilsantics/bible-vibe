'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BookOpen, ChevronRight } from 'lucide-react'
import { BIBLE_BOOKS } from '@/lib/bible-data'

interface LastPosition {
  book: string
  chapter: number
  translation: string
}

export function ContinueReading() {
  const [pos, setPos] = useState<LastPosition | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bv_last_position')
      if (saved) setPos(JSON.parse(saved))
    } catch {}
  }, [])

  if (!pos) return null

  const bookName = pos.book
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const bookMeta = BIBLE_BOOKS.find(
    (b) => b.name.toLowerCase().replace(/\s+/g, '-') === pos.book
  )
  const totalChapters = bookMeta?.chapters ?? null
  const nextChapter = totalChapters && pos.chapter < totalChapters ? pos.chapter + 1 : null
  const pct = totalChapters ? Math.round((pos.chapter / totalChapters) * 100) : null

  return (
    <div className="mb-2">
      <Link href={`/dashboard/reading/${pos.book}/${pos.chapter}?translation=${pos.translation}`}>
        <Card className="p-3 border-border hover:border-primary/40 transition-colors flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                Continue reading
              </p>
              <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                {bookName} {pos.chapter}
                {totalChapters && (
                  <span className="text-muted-foreground font-normal text-xs ml-1.5">
                    · ch {pos.chapter} of {totalChapters}
                    {pct !== null && pct > 0 && ` (${pct}%)`}
                  </span>
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Card>
      </Link>
      {nextChapter && (
        <Link href={`/dashboard/reading/${pos.book}/${nextChapter}?translation=${pos.translation}`}>
          <div className="mt-1 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
              Up next: {bookName} {nextChapter}
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          </div>
        </Link>
      )}
    </div>
  )
}
