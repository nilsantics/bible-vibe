import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlansClient } from '@/components/plans-client'
import { PLAN_TEMPLATES } from '@/lib/reading-plans'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: activePlans } = await supabase
    .from('reading_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
        Reading Plans
      </h1>
      <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: 'system-ui' }}>
        Follow a structured plan to read through the Bible systematically.
      </p>
      <PlansClient templates={PLAN_TEMPLATES} activePlans={activePlans ?? []} />
    </div>
  )
}
