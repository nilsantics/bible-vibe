import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { TutorialOverlay } from '@/components/tutorial-overlay'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { PwaPrompt } from '@/components/pwa-prompt'
import { getSubscription, isActiveSub } from '@/lib/stripe'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let streak = 0
  let isPro = false
  if (user) {
    const [streakRes, sub] = await Promise.all([
      supabase.from('streaks').select('current_streak').eq('user_id', user.id).single(),
      getSubscription(user.id),
    ])
    streak = streakRes.data?.current_streak ?? 0
    isPro = isActiveSub(sub)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={user} streak={streak} isPro={isPro} />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <MobileBottomNav />
      <TutorialOverlay />
      <OnboardingWizard />
      <PwaPrompt />
    </div>
  )
}
