import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// SM-2 algorithm
function sm2(
  currentDifficulty: number,
  currentInterval: number,
  currentRepetitions: number,
  quality: number // 0–5
): { difficulty: number; interval: number; repetitions: number; dueDate: string } {
  let repetitions = currentRepetitions
  let interval = currentInterval
  let difficulty = currentDifficulty

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * difficulty)
    }
    repetitions += 1
  }

  difficulty = Math.max(
    1.3,
    difficulty + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  // next review = today + interval days
  const due = new Date()
  due.setUTCHours(0, 0, 0, 0)
  due.setUTCDate(due.getUTCDate() + interval)
  const dueDate = due.toISOString().slice(0, 10)

  return { difficulty, interval, repetitions, dueDate }
}

// GET /api/memorize — cards due today for the logged-in user
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('memorization_cards')
    .select(
      `id, verse_id, difficulty, interval, repetitions, due_date, last_reviewed_at,
       verses!inner(id, book_id, chapter_number, verse_number, text,
         books!inner(name, abbreviation)
       )`
    )
    .eq('user_id', user.id)
    .lte('due_date', today)
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cards: data ?? [] })
}

// POST /api/memorize — add a verse to the memorization deck
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { verse_id } = body
  if (!verse_id) return NextResponse.json({ error: 'verse_id required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('memorization_cards')
    .upsert(
      {
        user_id: user.id,
        verse_id,
        difficulty: 2.5,
        interval: 1,
        repetitions: 0,
        due_date: today,
      },
      { onConflict: 'user_id,verse_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ card: data }, { status: 201 })
}

// PATCH /api/memorize — process a review
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { card_id, quality } = body

  if (!card_id) return NextResponse.json({ error: 'card_id required' }, { status: 400 })
  if (typeof quality !== 'number' || quality < 0 || quality > 5) {
    return NextResponse.json({ error: 'quality must be 0–5' }, { status: 400 })
  }

  // Fetch the current card (RLS ensures it belongs to this user)
  const { data: card, error: fetchError } = await supabase
    .from('memorization_cards')
    .select('difficulty, interval, repetitions')
    .eq('id', card_id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  const { difficulty, interval, repetitions, dueDate } = sm2(
    card.difficulty,
    card.interval,
    card.repetitions,
    quality
  )

  const { data: updated, error: updateError } = await supabase
    .from('memorization_cards')
    .update({
      difficulty,
      interval,
      repetitions,
      due_date: dueDate,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', card_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ card: updated })
}
