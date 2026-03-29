import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import { getLevelForXP, getXPToNextLevel } from '@/lib/xp'
import { BookMap } from '@/components/book-map'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [streakRes, xpRes, progressRes, badgesRes, notesRes, highlightsRes] =
    await Promise.all([
      supabase.from('streaks').select('*').eq('user_id', user.id).single(),
      supabase.from('user_xp').select('*').eq('user_id', user.id).single(),
      supabase.from('reading_progress').select('book_id, chapter_number, reading_date').eq('user_id', user.id),
      supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id),
      supabase.from('notes').select('id').eq('user_id', user.id),
      supabase.from('highlights').select('id').eq('user_id', user.id),
    ])

  const streak = streakRes.data
  const totalXP = xpRes.data?.total_xp ?? 0
  const level = getLevelForXP(totalXP)
  const xpInfo = getXPToNextLevel(totalXP)
  const progress = progressRes.data ?? []
  const badges = badgesRes.data ?? []
  const noteCount = notesRes.data?.length ?? 0
  const highlightCount = highlightsRes.data?.length ?? 0

  // Group progress by book
  const bookProgress: Record<number, Set<number>> = {}
  for (const p of progress) {
    if (!bookProgress[p.book_id]) bookProgress[p.book_id] = new Set()
    bookProgress[p.book_id].add(p.chapter_number)
  }

  const booksStarted = Object.keys(bookProgress).length
  const booksCompleted = BIBLE_BOOKS.filter(
    (b) => bookProgress[b.id]?.size >= b.chapters
  ).length

  // Flatten for BookMap (Set → number)
  const bookProgressCounts: Record<number, number> = {}
  for (const [id, chapters] of Object.entries(bookProgress)) {
    bookProgressCounts[parseInt(id)] = chapters.size
  }

  // Build 52-week heatmap data (daily reading counts)
  const readingDateCounts: Record<string, number> = {}
  for (const p of progress) {
    if (p.reading_date) {
      readingDateCounts[p.reading_date] = (readingDateCounts[p.reading_date] ?? 0) + 1
    }
  }

  // Generate last 52 weeks of dates (364 days) aligned to Sunday
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (364 + dayOfWeek))
  const heatmapDays: { date: string; count: number }[] = []
  for (let i = 0; i <= 364 + dayOfWeek; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    heatmapDays.push({ date: key, count: readingDateCounts[key] ?? 0 })
  }
  // Pad to full weeks
  while (heatmapDays.length % 7 !== 0) heatmapDays.push({ date: '', count: 0 })
  const heatmapWeeks: { date: string; count: number }[][] = []
  for (let i = 0; i < heatmapDays.length; i += 7) {
    heatmapWeeks.push(heatmapDays.slice(i, i + 7))
  }

  // Compute next badge to earn
  const chaptersRead = progress.length
  const currentStreak = streak?.current_streak ?? 0
  const otBooksRead = BIBLE_BOOKS.filter((b) => b.testament === 'Old' && bookProgress[b.id]).length
  const ntBooksRead = BIBLE_BOOKS.filter((b) => b.testament === 'New' && bookProgress[b.id]).length
  const earnedBadgeIds = new Set(badges.map((b) => (b as { badge_id: number }).badge_id ?? b.id))

  const ALL_BADGE_TARGETS = [
    { name: 'First Steps',  icon: '📖', desc: 'Read your first chapter',       current: chaptersRead,   target: 1,   rarity: 'common' },
    { name: 'Bookworm',     icon: '📚', desc: 'Read 10 chapters',              current: chaptersRead,   target: 10,  rarity: 'common' },
    { name: 'Week Warrior', icon: '🔥', desc: '7-day reading streak',          current: currentStreak,  target: 7,   rarity: 'common' },
    { name: 'Month Maven',  icon: '⚡', desc: '30-day reading streak',         current: currentStreak,  target: 30,  rarity: 'rare' },
    { name: 'Note Taker',   icon: '✍️', desc: 'Write 10 study notes',          current: noteCount,      target: 10,  rarity: 'common' },
    { name: 'Highlighter',  icon: '🖊️', desc: 'Highlight 25 verses',           current: highlightCount, target: 25,  rarity: 'common' },
    { name: 'OT Explorer',  icon: '📜', desc: 'Read every Old Testament book', current: otBooksRead,    target: 39,  rarity: 'epic' },
    { name: 'NT Explorer',  icon: '✝️', desc: 'Read every New Testament book', current: ntBooksRead,    target: 27,  rarity: 'epic' },
    { name: 'Scholar',      icon: '🎓', desc: 'Reach level 5',                 current: level.level,    target: 5,   rarity: 'rare' },
  ]

  // Find the badge the user is closest to (not yet earned, highest pct complete)
  const nextBadge = ALL_BADGE_TARGETS
    .filter((b) => !badges.some((ub) => (ub as { badges?: { name: string } }).badges?.name === b.name))
    .filter((b) => b.current < b.target)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))[0] ?? null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
        Your Progress
      </h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold flex items-center justify-center gap-1" style={{ fontFamily: 'system-ui' }}>
            <span className={streak?.current_streak ? 'streak-fire' : ''}>🔥</span>
            <span>{streak?.current_streak ?? 0}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>Current streak</p>
          {streak?.best_streak ? (
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Best: {streak.best_streak} days</p>
          ) : null}
        </Card>

        <Card className="p-4 text-center">
          <div className="text-3xl font-bold" style={{ fontFamily: 'system-ui' }}>{totalXP.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>Total XP</p>
          <p className="text-xs text-primary font-medium" style={{ fontFamily: 'system-ui' }}>{level.name}</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-3xl font-bold" style={{ fontFamily: 'system-ui' }}>{booksCompleted}</div>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>Books finished</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{booksStarted} started</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-3xl font-bold" style={{ fontFamily: 'system-ui' }}>{badges.length}</div>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>Badges earned</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{noteCount} notes, {highlightCount} hl</p>
        </Card>
      </div>

      {/* Level progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold" style={{ fontFamily: 'system-ui' }}>
            Level {level.level} — {level.name}
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            {xpInfo.xpInLevel.toLocaleString()} / {xpInfo.xpNeeded.toLocaleString()} XP
          </p>
        </div>
        <Progress value={xpInfo.progress} className="h-3" />
        {xpInfo.next && (
          <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: 'system-ui' }}>
            Next: <span className="text-foreground font-medium">{xpInfo.next.name}</span> at {xpInfo.next.min.toLocaleString()} XP
          </p>
        )}
      </Card>

      {/* Reading heatmap */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'system-ui' }}>Reading activity</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-0.5" style={{ minWidth: `${heatmapWeeks.length * 13}px` }}>
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  const intensity = day.count === 0 ? 0 : day.count === 1 ? 1 : day.count <= 3 ? 2 : 3
                  const colors = [
                    'bg-muted',
                    'bg-primary/25',
                    'bg-primary/55',
                    'bg-primary',
                  ]
                  return (
                    <div
                      key={di}
                      className={`w-2.5 h-2.5 rounded-sm ${colors[intensity]} transition-colors`}
                      title={day.date ? `${day.date}: ${day.count} chapter${day.count !== 1 ? 's' : ''}` : ''}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>Less</span>
          {['bg-muted', 'bg-primary/25', 'bg-primary/55', 'bg-primary'].map((c) => (
            <div key={c} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
          ))}
          <span className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>More</span>
        </div>
      </Card>

      {/* Next badge to earn */}
      {nextBadge && (
        <Card className="p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
              {nextBadge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm" style={{ fontFamily: 'system-ui' }}>{nextBadge.name}</p>
                <Badge variant="outline" className="text-xs capitalize">{nextBadge.rarity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{nextBadge.desc}</p>
            </div>
          </div>
          <Progress value={Math.min(100, Math.round((nextBadge.current / nextBadge.target) * 100))} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>
            <span className="text-foreground font-semibold text-primary">{nextBadge.current}</span>
            {' / '}
            {nextBadge.target}
            {' — '}
            <span className="text-primary font-medium">
              {nextBadge.target - nextBadge.current} more to unlock
            </span>
          </p>
        </Card>
      )}

      {/* 66-book completion map */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'system-ui' }}>
          Bible completion map
        </h2>
        <BookMap bookProgress={bookProgressCounts} />
      </Card>

      {/* Badges — earned + locked */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
          Badges {badges.length > 0 && <span className="text-muted-foreground font-normal text-sm">({badges.length} earned)</span>}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Earned */}
          {badges.map((ub) => {
            const badge = (ub as { badges: { name: string; description: string; icon: string; rarity: string } }).badges
            if (!badge) return null
            return (
              <Card key={ub.id} className="p-3 flex items-center gap-3">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>{badge.name}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{badge.description}</p>
                  <Badge variant="outline" className="text-xs mt-1">{badge.rarity}</Badge>
                </div>
              </Card>
            )
          })}
          {/* Locked */}
          {ALL_BADGE_TARGETS
            .filter((b) => !badges.some((ub) => (ub as { badges?: { name: string } }).badges?.name === b.name))
            .map((b) => (
              <Card key={b.name} className="p-3 flex items-center gap-3 opacity-40 grayscale">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: 'system-ui' }}>🔒 {b.name}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'system-ui' }}>{b.desc}</p>
                  <Badge variant="outline" className="text-xs mt-1">{b.rarity}</Badge>
                </div>
              </Card>
            ))
          }
        </div>
      </div>

      {/* Per-book progress */}
      <div>
        <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
          Books
        </h2>
        <div className="space-y-1.5">
          {BIBLE_BOOKS.filter((b) => bookProgress[b.id]).map((b) => {
            const chaptersRead = bookProgress[b.id]?.size ?? 0
            const pct = Math.round((chaptersRead / b.chapters) * 100)
            return (
              <Link
                key={b.id}
                href={`/dashboard/reading/${b.name.toLowerCase().replace(/\s+/g, '-')}/1`}
              >
                <div className="flex items-center gap-3 hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-medium truncate" style={{ fontFamily: 'system-ui' }}>{b.name}</p>
                  </div>
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <p className="text-xs text-muted-foreground w-16 text-right shrink-0" style={{ fontFamily: 'system-ui' }}>
                    {chaptersRead}/{b.chapters} ch
                  </p>
                </div>
              </Link>
            )
          })}
          {Object.keys(bookProgress).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: 'system-ui' }}>
              Start reading to track your progress here.{' '}
              <Link href="/dashboard/reading/genesis/1" className="text-primary hover:underline">
                Start with Genesis 1
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
