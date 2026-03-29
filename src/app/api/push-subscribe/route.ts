import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/push-subscribe — save a push subscription
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const subscription = await request.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: user?.id ?? null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )

  return NextResponse.json({ ok: true })
}

// DELETE /api/push-subscribe — remove a subscription
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { endpoint } = await request.json()
  if (endpoint) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
  return NextResponse.json({ ok: true })
}
