import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { TutorialOverlay } from '@/components/tutorial-overlay'
import { OnboardingWizard } from '@/components/onboarding-wizard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let streak = 0
  if (user) {
    const { data } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single()
    streak = data?.current_streak ?? 0
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={user} streak={streak} />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <MobileBottomNav />
      <TutorialOverlay />
      <OnboardingWizard />
    </div>
  )
}
