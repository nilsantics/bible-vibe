import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

// POST /api/push-send — send a notification to all subscribers (or a specific user)
// Body: { title, body, url?, user_id? }
// Protected by CRON_SECRET header for scheduled calls
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { title, body, url = '/dashboard', user_id } = await request.json()

  const supabase = await createClient()
  let query = supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (user_id) query = query.eq('user_id', user_id)

  const { data: subs } = await query
  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({ title, body, url, icon: '/icon-192.png' })

  let sent = 0
  const dead: string[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        // 404/410 = subscription expired — remove it
        if (err && typeof err === 'object' && 'statusCode' in err) {
          const code = (err as { statusCode: number }).statusCode
          if (code === 404 || code === 410) dead.push(sub.endpoint)
        }
      }
    })
  )

  // Cleanup dead subscriptions
  if (dead.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', dead)
  }

  return NextResponse.json({ sent, dead: dead.length })
}
