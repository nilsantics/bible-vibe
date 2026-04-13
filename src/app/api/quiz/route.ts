import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/claude'
import { getBookById } from '@/lib/bible-data'
import { checkFeatureRateLimit } from '@/lib/rate-limit'

// POST /api/quiz  { passage: "John 3:16-21" }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to generate a quiz.' }, { status: 401 })

  const limit = await checkFeatureRateLimit(user.id)
  if (!limit.allowed) return NextResponse.json({ error: limit.message }, { status: 429 })

  const { passage } = await request.json()
  if (!passage?.trim()) {
    return NextResponse.json({ error: 'Passage is required' }, { status: 400 })
  }
  const questions = await generateQuiz(passage.trim(), '')
  if (!questions.length) {
    return NextResponse.json({ error: 'No questions returned. Try rephrasing the passage.' }, { status: 422 })
  }
  return NextResponse.json({ questions, passageRef: passage.trim() })
}

// GET /api/quiz?book_id=X&chapter=Y
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookIdParam = searchParams.get('book_id')
  const chapterParam = searchParams.get('chapter')

  if (!bookIdParam || !chapterParam) {
    return NextResponse.json({ error: 'book_id and chapter are required' }, { status: 400 })
  }

  const bookId = parseInt(bookIdParam, 10)
  const chapter = parseInt(chapterParam, 10)

  if (isNaN(bookId) || isNaN(chapter)) {
    return NextResponse.json({ error: 'book_id and chapter must be numbers' }, { status: 400 })
  }

  const book = getBookById(bookId)
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const supabase = await createClient()

  // Fetch all verses from the chapter using translation_id=1 (WEB)
  const { data: verses, error } = await supabase
    .from('verses')
    .select('verse_number, text')
    .eq('book_id', bookId)
    .eq('chapter_number', chapter)
    .eq('translation_id', 1)
    .order('verse_number')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!verses || verses.length === 0) {
    return NextResponse.json({ error: 'No verses found for this chapter' }, { status: 404 })
  }

  // Pick up to 10 verses around a random starting point for a focused passage
  const maxStart = Math.max(0, verses.length - 10)
  const startIdx = Math.floor(Math.random() * (maxStart + 1))
  const selectedVerses = verses.slice(startIdx, startIdx + 10)

  const startVerse = selectedVerses[0].verse_number
  const endVerse = selectedVerses[selectedVerses.length - 1].verse_number
  const passageRef =
    startVerse === endVerse
      ? `${book.name} ${chapter}:${startVerse}`
      : `${book.name} ${chapter}:${startVerse}-${endVerse}`

  const passageText = selectedVerses.map((v) => `[${v.verse_number}] ${v.text}`).join(' ')

  const questions = await generateQuiz(passageRef, passageText)

  return NextResponse.json({ questions, passageRef })
}
