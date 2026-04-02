import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Delete user data in order
  await Promise.all([
    admin.from('highlights').delete().eq('user_id', user.id),
    admin.from('notes').delete().eq('user_id', user.id),
    admin.from('bookmarks').delete().eq('user_id', user.id),
    admin.from('streaks').delete().eq('user_id', user.id),
    admin.from('user_xp').delete().eq('user_id', user.id),
    admin.from('user_badges').delete().eq('user_id', user.id),
    admin.from('reading_plans').delete().eq('user_id', user.id),
    admin.from('push_subscriptions').delete().eq('user_id', user.id),
  ])

  await admin.from('profiles').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ ok: true })
}
