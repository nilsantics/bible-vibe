'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BookOpen, ChevronRight } from 'lucide-react'

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

  return (
    <Link href={`/dashboard/reading/${pos.book}/${pos.chapter}?translation=${pos.translation}`}>
      <Card className="p-3 border-border hover:border-primary/40 transition-colors flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
              Continue where you left off
            </p>
            <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
              {bookName} {pos.chapter}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Card>
    </Link>
  )
}
