import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { getLevelForXP, getXPToNextLevel } from '@/lib/xp'
import { getVerseOfDay } from '@/lib/verse-of-day'
import { BookOpen, ChevronRight, CalendarDays, Sparkles, GitBranch, Languages } from 'lucide-react'
import { PLAN_TEMPLATES, getTodayAssignment } from '@/lib/reading-plans'
import { DevotionalCard } from '@/components/devotional-card'
import { ContinueReading } from '@/components/continue-reading'

const QUICK_START_BOOKS = [
  { name: 'Genesis',  chapter: 1, desc: 'The beginning of everything' },
  { name: 'John',     chapter: 1, desc: "Jesus's life and teaching" },
  { name: 'Psalms',   chapter: 23, desc: 'Poetry and worship' },
  { name: 'Romans',   chapter: 1, desc: 'The gospel explained' },
]

const NEW_USER_PICKS = [
  {
    name: 'John', chapter: 1,
    icon: '✨',
    title: 'Start with John 1',
    desc: 'The most-read chapter in the Bible. "In the beginning was the Word..." Perfect first read.',
    tag: 'Most popular starting point',
  },
  {
    name: 'Psalms', chapter: 23,
    icon: '🌿',
    title: 'Psalm 23',
    desc: '"The Lord is my shepherd." One of the most loved passages in all of Scripture.',
    tag: 'Short & beautiful',
  },
  {
    name: 'Genesis', chapter: 1,
    icon: '🌍',
    title: 'Genesis 1',
    desc: 'The very beginning. Creation, light, and the foundations of everything.',
    tag: 'Start at the beginning',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let streak = 0
  let totalXP = 0
  let level = { level: 1, name: 'Seeker' }
  let xpProgress = { progress: 0, xpInLevel: 0, xpNeeded: 500 }
  let recentReading: { book_id: number; chapter_number: number }[] = []
  let badgeCount = 0
  let todayPlanTask: { icon: string; name: string; bookName: string; chapters: number[]; href: string } | null = null

  // Verse of the day
  const votd = getVerseOfDay()
  const { data: votdVerse } = await supabase
    .from('verses')
    .select('id, text, book_id, chapter_number, verse_number')
    .eq('book_id', votd.book_id)
    .eq('chapter_number', votd.chapter)
    .eq('verse_number', votd.verse)
    .eq('translation_id', 1) // WEB default
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

    // Today's plan assignment (first active plan)
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

    // Last 3 chapters read
    const { data: recent } = await supabase
      .from('reading_progress')
      .select('book_id, chapter_number, reading_date')
      .eq('user_id', user.id)
      .order('reading_date', { ascending: false })
      .limit(3)
    recentReading = recent ?? []
  }

  const isNewUser = user !== null && totalXP === 0 && recentReading.length === 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* New-user onboarding hero */}
      {isNewUser && (
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-primary-foreground font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>✦</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome to Bible Vibe
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto" style={{ fontFamily: 'system-ui' }}>
              Your journey through Scripture starts here. Pick a passage below and tap any verse — you&apos;ll get instant cross-references, original language tools, and deep explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {NEW_USER_PICKS.map((pick) => (
              <Link
                key={pick.name + pick.chapter}
                href={`/dashboard/reading/${pick.name.toLowerCase()}/${pick.chapter}`}
              >
                <Card className="p-5 h-full border-border hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer">
                  <div className="text-2xl mb-3">{pick.icon}</div>
                  <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'system-ui' }}>
                    {pick.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3" style={{ fontFamily: 'system-ui' }}>
                    {pick.desc}
                  </p>
                  <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: 'system-ui' }}>
                    {pick.tag}
                  </span>
                </Card>
              </Link>
            ))}
          </div>

          {/* Feature mini-tour */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {[
              { icon: GitBranch, label: '430,000 cross-references', desc: 'Instant, free, no AI' },
              { icon: Languages, label: "Strong's Hebrew & Greek", desc: '14,000+ word entries' },
              { icon: Sparkles, label: 'Ezra study companion', desc: 'Ask anything about the passage' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/30">
                <f.icon className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs font-semibold" style={{ fontFamily: 'system-ui' }}>{f.label}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border my-8" />
        </div>
      )}

      {/* Welcome header (returning users) */}
      {!isNewUser && (
        <div className="mb-8">
          {user ? (
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: 'system-ui' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                Start studying the Bible
              </h1>
              <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: 'system-ui' }}>
                <Link href="/auth/signup" className="text-primary hover:underline">Create a free account</Link>{' '}
                to save highlights, notes, and track your progress.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verse of the Day */}
      {votdVerse && votdBook && (
        <Link href={`/dashboard/reading/${votdBook.name.toLowerCase().replace(/\s+/g, '-')}/${votd.chapter}#v${votd.verse}`}>
          <Card className="p-5 mb-6 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                  Verse of the Day
                </p>
                <p className="bible-text text-sm leading-relaxed text-foreground italic mb-2">
                  &ldquo;{votdVerse.text}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                  — {votdBook.name} {votd.chapter}:{votd.verse}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </Card>
        </Link>
      )}

      {/* Daily Devotional */}
      {votdVerse && votdBook && (
        <div className="mb-6">
          <DevotionalCard
            bookId={votd.book_id}
            chapter={votd.chapter}
            verse={votd.verse}
            verseRef={`${votdBook.name} ${votd.chapter}:${votd.verse}`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — stats + quick start */}
        <div className="lg:col-span-2 space-y-5">

          {/* Stats row */}
          {user && (
            <div className="grid grid-cols-3 gap-3">
              {/* Streak */}
              <Card className="p-4 text-center border-border">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  <span className={streak > 0 ? 'streak-fire' : ''}>🔥</span>
                  <span style={{ fontFamily: 'system-ui' }}>{streak}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
                  Day streak
                </p>
              </Card>

              {/* XP + Level */}
              <Card className="p-4 text-center border-border">
                <div className="text-2xl font-bold" style={{ fontFamily: 'system-ui' }}>
                  {totalXP.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
                  XP &bull; {level.name}
                </p>
              </Card>

              {/* Badges */}
              <Card className="p-4 text-center border-border">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  <span>🏆</span>
                  <span style={{ fontFamily: 'system-ui' }}>{badgeCount}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
                  Badges earned
                </p>
              </Card>
            </div>
          )}

          {/* XP Progress */}
          {user && (
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                  {level.name}
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                  {xpProgress.xpInLevel.toLocaleString()} / {xpProgress.xpNeeded.toLocaleString()} XP
                </p>
              </div>
              <Progress value={xpProgress.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: 'system-ui' }}>
                {xpProgress.progress < 100
                  ? `${100 - xpProgress.progress}% to next level`
                  : 'Max level reached!'}
              </p>
            </Card>
          )}

          {/* Today's plan */}
          {todayPlanTask && (
            <Link href={todayPlanTask.href}>
              <Card className="p-4 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wide" style={{ fontFamily: 'system-ui' }}>
                      {todayPlanTask.icon} {todayPlanTask.name} — Today
                    </p>
                    <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                      {todayPlanTask.bookName} {todayPlanTask.chapters.join(', ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </Link>
          )}

          {/* Continue reading — last position from localStorage (works even without login) */}
          <ContinueReading />

          {/* Continue reading — server-side recent chapters (logged in users) */}
          {user && recentReading.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
                Continue reading
              </h2>
              <div className="space-y-2">
                {recentReading.map((r, i) => {
                  const bookMeta = BIBLE_BOOKS.find((b) => b.id === r.book_id)
                  if (!bookMeta) return null
                  return (
                    <Link
                      key={i}
                      href={`/dashboard/reading/${bookMeta.name.toLowerCase().replace(/\s+/g, '-')}/${r.chapter_number}`}
                    >
                      <Card className="p-3 border-border hover:border-primary/40 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>
                              {bookMeta.name} {r.chapter_number}
                            </p>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                              {bookMeta.testament} Testament
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick start */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
              {user && recentReading.length > 0 ? 'Suggested passages' : 'Start reading'}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_START_BOOKS.map((b) => (
                <Link
                  key={b.name}
                  href={`/dashboard/reading/${b.name.toLowerCase()}/${b.chapter}`}
                >
                  <Card className="p-3 border-border hover:border-primary/40 transition-colors h-full">
                    <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                      {b.name} {b.chapter}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'system-ui' }}>
                      {b.desc}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — Browse all books */}
        <div className="space-y-5">
          <Card className="p-4 border-border">
            <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
              Browse all books
            </h2>
            <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {BIBLE_BOOKS.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/reading/${b.name.toLowerCase().replace(/\s+/g, '-')}/1`}
                >
                  <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/60 transition-colors">
                    <span className="text-xs" style={{ fontFamily: 'system-ui' }}>{b.name}</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
                      {b.chapters}ch
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
