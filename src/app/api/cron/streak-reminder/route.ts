import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Called by Vercel Cron at 7pm UTC daily
// Finds users with streaks > 0 who haven't read today, sends a nudge
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get users with streaks who have subscriptions
  const { data: subscribers } = await supabase
    .from('push_subscriptions')
    .select('user_id')
    .not('user_id', 'is', null)

  if (!subscribers?.length) return NextResponse.json({ sent: 0 })

  const userIds = [...new Set(subscribers.map((s) => s.user_id).filter(Boolean))]

  // Find who has a streak but hasn't read today
  const { data: streaks } = await supabase
    .from('streaks')
    .select('user_id, current_streak')
    .in('user_id', userIds)
    .gt('current_streak', 0)

  const { data: todayReaders } = await supabase
    .from('reading_progress')
    .select('user_id')
    .in('user_id', userIds)
    .eq('reading_date', today)

  const readToday = new Set((todayReaders ?? []).map((r) => r.user_id))
  const needsNudge = (streaks ?? []).filter((s) => !readToday.has(s.user_id))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://studykairos.app'
  let sent = 0

  await Promise.allSettled(
    needsNudge.map(async (s) => {
      const res = await fetch(`${siteUrl}/api/push-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.CRON_SECRET!,
        },
        body: JSON.stringify({
          title: `🔥 ${s.current_streak}-day streak at risk!`,
          body: 'Read one chapter today to keep your streak alive.',
          url: '/dashboard',
          user_id: s.user_id,
        }),
      })
      if (res.ok) sent++
    })
  )

  return NextResponse.json({ ok: true, nudged: needsNudge.length, sent })
}
