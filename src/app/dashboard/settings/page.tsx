import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings-form'
import { getSubscription, isActiveSub } from '@/lib/stripe'
import { Zap } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, sub] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getSubscription(user.id),
  ])
  const profile = profileRes.data
  const isPro = isActiveSub(sub)

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
        Settings
      </h1>

      {/* Plan card */}
      <div className={`rounded-2xl border p-5 space-y-3 ${isPro ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
              Current plan
            </p>
            <p className="text-lg font-bold mt-0.5 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
              {isPro ? (
                <>
                  <Zap className="w-4 h-4 text-primary" />
                  Kairos Pro
                </>
              ) : (
                'Free'
              )}
            </p>
          </div>
          <Link
            href="/dashboard/upgrade"
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              isPro
                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            style={{ fontFamily: 'system-ui' }}
          >
            {isPro ? 'Manage' : 'Upgrade to Pro'}
          </Link>
        </div>
        {isPro && periodEnd && (
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {sub?.cancel_at_period_end ? `Ends ${periodEnd}` : `Renews ${periodEnd}`}
          </p>
        )}
        {!isPro && (
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            20 Ezra messages / day · WEB, KJV, BSB & ESV translations · Basic reading plans
          </p>
        )}
      </div>

      <SettingsForm user={user} profile={profile} />
    </div>
  )
}
