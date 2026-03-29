import { NextRequest, NextResponse } from 'next/server'
import { getVerseOfDay } from '@/lib/verse-of-day'
import { BIBLE_BOOKS } from '@/lib/bible-data'

// Called by Vercel Cron at 8am UTC daily
// vercel.json: { "crons": [{ "path": "/api/cron/daily-verse", "schedule": "0 8 * * *" }] }
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const votd = getVerseOfDay()
  const book = BIBLE_BOOKS.find((b) => b.id === votd.book_id)
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 500 })

  const ref = `${book.name} ${votd.chapter}:${votd.verse}`
  const url = `/dashboard/reading/${book.name.toLowerCase().replace(/\s+/g, '-')}/${votd.chapter}#v${votd.verse}`

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bible-vibe-eight.vercel.app'}/api/push-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET!,
    },
    body: JSON.stringify({
      title: `📖 Verse of the Day — ${ref}`,
      body: 'Open Bible Vibe to read today\'s verse.',
      url,
    }),
  })

  const data = await res.json()
  return NextResponse.json({ ok: true, ...data })
}
