import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLevelForXP } from '@/lib/xp'

const XP_PER_CHAPTER = 10

// OT = book_ids 1–39, NT = 40–66
const OT_MAX = 39

// POST /api/progress — mark a chapter as read, award XP, update streak, check badges
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { book_id, chapter_number } = await request.json()
  if (!book_id || !chapter_number) {
    return NextResponse.json({ error: 'book_id and chapter_number required' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // 1. Upsert reading_progress (idempotent)
  const { data: existing } = await supabase
    .from('reading_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', book_id)
    .eq('chapter_number', chapter_number)
    .single()

  if (existing) {
    return NextResponse.json({ xpAwarded: 0, alreadyRead: true })
  }

  await supabase.from('reading_progress').insert({
    user_id: user.id,
    book_id,
    chapter_number,
    reading_date: today,
  })

  // 2. Award XP
  const { data: xpRow } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', user.id)
    .single()

  const oldXP = xpRow?.total_xp ?? 0
  const newXP = oldXP + XP_PER_CHAPTER
  await supabase
    .from('user_xp')
    .upsert({ user_id: user.id, total_xp: newXP }, { onConflict: 'user_id' })

  // 3. Update streak
  const { data: streakRow } = await supabase
    .from('streaks')
    .select('current_streak, best_streak, last_read_date')
    .eq('user_id', user.id)
    .single()

  const lastDate = streakRow?.last_read_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  let newStreak = 1
  if (lastDate === today) {
    newStreak = streakRow?.current_streak ?? 1
  } else if (lastDate === yesterdayStr) {
    newStreak = (streakRow?.current_streak ?? 0) + 1
  }

  const newBest = Math.max(newStreak, streakRow?.best_streak ?? 0)
  await supabase
    .from('streaks')
    .upsert(
      { user_id: user.id, current_streak: newStreak, best_streak: newBest, last_read_date: today },
      { onConflict: 'user_id' }
    )

  // 4. Badge checking
  const newBadges: string[] = []

  // Fetch all badges and already-earned badges in parallel
  const [{ data: allBadges }, { data: earnedBadges }, { data: allProgress }] = await Promise.all([
    supabase.from('badges').select('id, name, icon, requirement_type, requirement_value'),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    supabase.from('reading_progress').select('book_id').eq('user_id', user.id),
  ])

  if (allBadges && earnedBadges) {
    const earnedIds = new Set(earnedBadges.map((e) => e.badge_id))
    const unearned = allBadges.filter((b) => !earnedIds.has(b.id))

    // Compute stats for badge checks
    const allBooksRead = new Set((allProgress ?? []).map((p) => p.book_id))
    const chaptersReadCount = (allProgress ?? []).length
    const otBooksRead = [...allBooksRead].filter((id) => id <= OT_MAX).length
    const ntBooksRead = [...allBooksRead].filter((id) => id > OT_MAX).length
    const newLevel = getLevelForXP(newXP).level
    const oldLevel = getLevelForXP(oldXP).level

    for (const badge of unearned) {
      let earned = false
      switch (badge.requirement_type) {
        case 'chapters_read':
          earned = chaptersReadCount >= badge.requirement_value
          break
        case 'streak_days':
          earned = newStreak >= badge.requirement_value
          break
        case 'ot_books_read':
          earned = otBooksRead >= badge.requirement_value
          break
        case 'nt_books_read':
          earned = ntBooksRead >= badge.requirement_value
          break
        case 'books_read':
          earned = allBooksRead.size >= badge.requirement_value
          break
        case 'level':
          earned = newLevel >= badge.requirement_value && newLevel > oldLevel
          break
      }

      if (earned) {
        await supabase
          .from('user_badges')
          .insert({ user_id: user.id, badge_id: badge.id })
          .select()
        newBadges.push(`${badge.icon} ${badge.name}`)
      }
    }
  }

  return NextResponse.json({ xpAwarded: XP_PER_CHAPTER, newXP, newStreak, newBadges })
}
