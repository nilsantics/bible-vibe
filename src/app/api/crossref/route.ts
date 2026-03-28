import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'

export interface CrossRefResult {
  book_id: number
  book_name: string
  chapter: number
  verse: number
  ref: string // e.g. "Genesis 1:1"
}

// GET /api/crossref?book_id=1&chapter=1&verse=1
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const book_id = parseInt(params.get('book_id') ?? '0')
  const chapter = parseInt(params.get('chapter') ?? '0')
  const verse   = parseInt(params.get('verse')   ?? '0')

  if (!book_id || !chapter || !verse) {
    return NextResponse.json({ error: 'book_id, chapter, verse required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cross_references')
    .select('to_book_id, to_chapter, to_verse')
    .eq('from_book_id', book_id)
    .eq('from_chapter', chapter)
    .eq('from_verse', verse)
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: CrossRefResult[] = (data ?? []).map((row) => {
    const book = BIBLE_BOOKS.find((b) => b.id === row.to_book_id)
    return {
      book_id: row.to_book_id,
      book_name: book?.name ?? 'Unknown',
      chapter: row.to_chapter,
      verse: row.to_verse,
      ref: `${book?.name ?? 'Unknown'} ${row.to_chapter}:${row.to_verse}`,
    }
  })

  return NextResponse.json({ crossRefs: results })
}
