import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { getLevelForXP, getXPToNextLevel } from '@/lib/xp'
import { getVerseOfDay } from '@/lib/verse-of-day'
import { BookOpen, ChevronRight, CalendarDays, Map, BookMarked, GraduationCap, Trophy, Zap, History, ArrowRight } from 'lucide-react'
import { PLAN_TEMPLATES, getTodayAssignment } from '@/lib/reading-plans'
import { DevotionalCard } from '@/components/devotional-card'
import { ContinueReading } from '@/components/continue-reading'
import { UpgradeToast, WelcomeToast } from '@/components/upgrade-toast'
import { PushPrompt } from '@/components/push-prompt'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const QUICK_ACTIONS = [
  { href: '/dashboard/reading/genesis/1', icon: BookOpen,     label: 'Bible Reader',   desc: 'Continue reading' },
  { href: '/dashboard/maps',              icon: Map,           label: 'Biblical Maps',  desc: 'Geography of Scripture' },
  { href: '/dashboard/church-fathers',    icon: BookMarked,    label: 'Church Fathers', desc: 'Early church writings' },
  { href: '/dashboard/topics',            icon: GraduationCap, label: 'Topics',         desc: 'Browse by theme' },
]

const PLAN_SUGGESTIONS = [
  { id: 'chronological',  icon: '📅', title: 'Chronological Bible',        desc: 'Read the Bible in historical order',       days: 365, gradient: 'from-amber-500 to-orange-600' },
  { id: 'new-testament',  icon: '✝️', title: 'New Testament in 90 Days',   desc: 'Gospels, Acts, Epistles & Revelation',     days: 90,  gradient: 'from-sky-500 to-blue-600' },
  { id: 'psalms-proverbs',icon: '🌿', title: 'Psalms & Proverbs',          desc: 'Poetry and wisdom for daily life',         days: 31,  gradient: 'from-emerald-500 to-green-600' },
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; welcome?: string }>
}) {
  const { upgraded, welcome } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let streak = 0
  let totalXP = 0
  let level = { level: 1, name: 'Seeker' }
  let xpProgress = { progress: 0, xpInLevel: 0, xpNeeded: 500 }
  let recentReading: { book_id: number; chapter_number: number; reading_date: string }[] = []
  let badgeCount = 0
  let todayPlanTask: { icon: string; name: string; bookName: string; chapters: number[]; href: string } | null = null

  const votd = getVerseOfDay()
  const { data: votdVerse } = await supabase
    .from('verses')
    .select('id, text, book_id, chapter_number, verse_number')
    .eq('book_id', votd.book_id)
    .eq('chapter_number', votd.chapter)
    .eq('verse_number', votd.verse)
    .eq('translation_id', 1)
    .single()
  const votdBook = BIBLE_BOOKS.find((b) => b.id === votd.book_id)

  if (user) {
    const [streakRes, xpRes, badgesRes, plansRes] = await Promise.all([
      supabase.from('streaks').select('current_streak').eq('user_id', user.id).single(),
      supabase.from('user_xp').select('total_xp, level').eq('user_id', user.id).single(),
      supabase.from('user_badges').select('id').eq('user_id', user.id),
      supabase.from('reading_plans').select('plan_type, name, start_date').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    streak = streakRes.data?.current_streak ?? 0
    totalXP = xpRes.data?.total_xp ?? 0
    level = getLevelForXP(totalXP)
    const xpInfo = getXPToNextLevel(totalXP)
    xpProgress = { progress: xpInfo.progress, xpInLevel: xpInfo.xpInLevel, xpNeeded: xpInfo.xpNeeded }
    badgeCount = badgesRes.data?.length ?? 0

    const activePlans = plansRes.data ?? []
    for (const plan of activePlans) {
      const template = PLAN_TEMPLATES.find((t) => t.id === plan.plan_type)
      if (!template) continue
      const assignment = getTodayAssignment(template, plan.start_date)
      if (assignment) {
        todayPlanTask = {
          icon: template.icon,
          name: plan.name,
          bookName: assignment.bookName,
          chapters: assignment.chapters,
          href: `/dashboard/reading/${assignment.bookName.toLowerCase().replace(/\s+/g, '-')}/${assignment.chapters[0]}`,
        }
        break
      }
    }

    const { data: recent } = await supabase
      .from('reading_progress')
      .select('book_id, chapter_number, reading_date')
      .eq('user_id', user.id)
      .order('reading_date', { ascending: false })
      .limit(5)
    recentReading = recent ?? []
  }

  const displayName = user?.email?.split('@')[0] ?? null
  const greeting = getGreeting()

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-28 sm:pb-8">
      {upgraded === '1' && <UpgradeToast />}
      {welcome === '1' && <WelcomeToast />}
      {user && <PushPrompt streak={streak} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left / main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Greeting */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                {greeting}{displayName ? `, ${displayName}` : ''}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {user && streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full px-3 py-1.5 shrink-0">
                <span className="streak-fire text-base">🔥</span>
                <span className="text-sm font-bold" style={{ fontFamily: 'system-ui' }}>{streak}</span>
              </div>
            )}
          </div>

          {/* Verse of the Day — shown inline on mobile, hidden on lg (it's in sidebar) */}
          {votdVerse && votdBook && (
            <Link href={`/dashboard/reading/${votdBook.name.toLowerCase().replace(/\s+/g, '-')}/${votd.chapter}#v${votd.verse}`} className="block lg:hidden">
              <div className="rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 transition-colors group">
                <p className="text-[10px] font-bold text-primary/70 mb-2.5 uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>
                  Verse of the Day
                </p>
                <p className="text-base leading-relaxed text-foreground italic mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  &ldquo;{votdVerse.text.length > 180 ? votdVerse.text.slice(0, 180) + '…' : votdVerse.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium" style={{ fontFamily: 'system-ui' }}>
                    {votdBook.name} {votd.chapter}:{votd.verse}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          )}

          {/* Today's reading plan */}
          {todayPlanTask ? (
            <Link href={todayPlanTask.href}>
              <Card className="p-4 border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/8 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                    {todayPlanTask.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5" style={{ fontFamily: 'system-ui' }}>
                      Today&apos;s Reading Plan
                    </p>
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: 'system-ui' }}>
                      {todayPlanTask.name}
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                      {todayPlanTask.bookName} {todayPlanTask.chapters.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary shrink-0">
                    <span className="text-xs font-medium hidden sm:block" style={{ fontFamily: 'system-ui' }}>Read</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <Link href="/dashboard/plans">
              <Card className="p-4 border-dashed border-border hover:border-primary/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                      Start a reading plan
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                      Guided journeys through Scripture
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Card>
            </Link>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="p-3 border-border hover:border-primary/40 hover:bg-primary/5 transition-all group h-full flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:gap-2">
                  <div className="w-9 h-9 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors flex items-center justify-center shrink-0">
                    <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                      {action.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block" style={{ fontFamily: 'system-ui' }}>
                      {action.desc}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Continue reading */}
          <ContinueReading />

          {/* Recent activity */}
          {user && recentReading.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'system-ui' }}>
                  <History className="w-4 h-4 text-muted-foreground" />
                  Recent reading
                </h2>
                <Link href="/dashboard/study-history" className="text-xs text-primary hover:underline" style={{ fontFamily: 'system-ui' }}>
                  View all
                </Link>
              </div>
              <div className="space-y-1.5">
                {recentReading.slice(0, 4).map((r, i) => {
                  const bookMeta = BIBLE_BOOKS.find((b) => b.id === r.book_id)
                  if (!bookMeta) return null
                  const nextCh = r.chapter_number < bookMeta.chapters ? r.chapter_number + 1 : null
                  return (
                    <Link key={i} href={`/dashboard/reading/${bookMeta.name.toLowerCase().replace(/\s+/g, '-')}/${nextCh ?? r.chapter_number}`}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors group">
                        <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                            {bookMeta.name} {r.chapter_number}
                          </p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                            {nextCh ? `Continue with ch ${nextCh}` : 'Completed'}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reading plan suggestions — horizontal scroll on mobile */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ fontFamily: 'system-ui' }}>Reading plans</h2>
              <Link href="/dashboard/plans" className="text-xs text-primary hover:underline" style={{ fontFamily: 'system-ui' }}>See all</Link>
            </div>
            {/* Mobile: horizontal scroll strip */}
            <div className="flex gap-3 overflow-x-auto pb-1 sm:hidden snap-x snap-mandatory scrollbar-none">
              {PLAN_SUGGESTIONS.map((plan) => (
                <Link key={plan.id} href="/dashboard/plans" className="shrink-0 snap-start w-48">
                  <div className="rounded-2xl overflow-hidden border border-border">
                    <div className={`h-20 bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <span className="text-3xl">{plan.icon}</span>
                    </div>
                    <div className="p-3 bg-card">
                      <p className="text-xs font-semibold leading-snug" style={{ fontFamily: 'system-ui' }}>{plan.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{plan.days} days</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Desktop: 3-col grid */}
            <div className="hidden sm:grid grid-cols-3 gap-3">
              {PLAN_SUGGESTIONS.map((plan) => (
                <Link key={plan.id} href="/dashboard/plans">
                  <div className="rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-colors group cursor-pointer">
                    <div className={`h-16 bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <span className="text-2xl">{plan.icon}</span>
                    </div>
                    <div className="p-3 bg-card">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors leading-snug" style={{ fontFamily: 'system-ui' }}>{plan.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug" style={{ fontFamily: 'system-ui' }}>{plan.desc}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">{plan.days} days</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar (desktop only) ── */}
        <div className="hidden lg:flex flex-col gap-5">

          {/* Verse of the Day */}
          {votdVerse && votdBook && (
            <Link href={`/dashboard/reading/${votdBook.name.toLowerCase().replace(/\s+/g, '-')}/${votd.chapter}#v${votd.verse}`}>
              <div className="rounded-2xl border border-border bg-card px-5 py-5 hover:border-primary/40 transition-colors group cursor-pointer">
                <p className="text-[10px] font-bold text-primary/70 mb-3 uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>
                  Verse of the Day
                </p>
                <p className="text-base leading-relaxed text-foreground italic mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  &ldquo;{votdVerse.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium" style={{ fontFamily: 'system-ui' }}>
                    {votdBook.name} {votd.chapter}:{votd.verse}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          )}

          {/* Daily Devotional */}
          {votdVerse && votdBook && (
            <DevotionalCard
              bookId={votd.book_id}
              chapter={votd.chapter}
              verse={votd.verse}
              verseRef={`${votdBook.name} ${votd.chapter}:${votd.verse}`}
            />
          )}

          {/* Streak + Stats */}
          {user && (
            <Card className="p-4 border-border">
              <h3 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-3" style={{ fontFamily: 'system-ui' }}>
                Your progress
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold mb-0.5">
                    <span className={streak > 0 ? 'streak-fire' : ''}>🔥</span>
                    <span style={{ fontFamily: 'system-ui' }}>{streak}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Day streak</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5 flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span style={{ fontFamily: 'system-ui' }}>{badgeCount}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Badges</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span style={{ fontFamily: 'system-ui' }}>{totalXP >= 1000 ? `${(totalXP / 1000).toFixed(1)}k` : totalXP}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'system-ui' }}>XP</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ fontFamily: 'system-ui' }}>{level.name}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                    {xpProgress.xpInLevel.toLocaleString()} / {xpProgress.xpNeeded.toLocaleString()} XP
                  </p>
                </div>
                <Progress value={xpProgress.progress} className="h-1.5" />
              </div>
              <Link href="/dashboard/progress" className="flex items-center justify-center gap-1 mt-3 text-xs text-primary hover:underline" style={{ fontFamily: 'system-ui' }}>
                View full progress <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>
          )}

          {/* Sign-in prompt for guests */}
          {!user && (
            <Card className="p-5 border-border text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'system-ui' }}>Track your journey</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed" style={{ fontFamily: 'system-ui' }}>
                Create a free account to save highlights, notes, build streaks, and earn badges.
              </p>
              <Link href="/auth/signup">
                <div className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:opacity-90 transition-opacity" style={{ fontFamily: 'system-ui' }}>
                  Get started free
                </div>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
