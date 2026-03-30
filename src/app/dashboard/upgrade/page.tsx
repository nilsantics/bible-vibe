import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscription, isActiveSub } from '@/lib/stripe'
import { UpgradeClient } from './upgrade-client'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sub = await getSubscription(user.id)
  const isPro = isActiveSub(sub)

  return <UpgradeClient isPro={isPro} subscription={sub} />
}
