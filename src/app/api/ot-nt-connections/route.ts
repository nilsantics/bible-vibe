import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'

export type ConnectionType = 'quote' | 'allusion' | 'echo'
export type ConnectionDirection = 'fulfillment' | 'source'

export interface OtNtConnection {
  id: number
  type: ConnectionType
  note: string | null
  ref: string          // e.g. "Isaiah 53:4" or "Matthew 8:17"
  book_name: string
  chapter: number
  verse: number
  direction: ConnectionDirection // 'fulfillment' = NT verse (OT reader) | 'source' = OT verse (NT reader)
}

// GET /api/ot-nt-connections?book_id=X&chapter=Y&verse=Z
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const book_id = parseInt(params.get('book_id') ?? '0')
  const chapter  = parseInt(params.get('chapter')  ?? '0')
  const verse    = parseInt(params.get('verse')    ?? '0')

  if (!book_id || !chapter || !verse) {
    return NextResponse.json({ error: 'book_id, chapter, verse required' }, { status: 400 })
  }

  const isOT = book_id <= 39
  const supabase = await createClient()

  const results: OtNtConnection[] = []

  if (isOT) {
    // OT verse → find NT fulfillments
    const { data } = await supabase
      .from('ot_nt_connections')
      .select('id, type, note, nt_book_id, nt_chapter, nt_verse')
      .eq('ot_book_id', book_id)
      .eq('ot_chapter', chapter)
      .eq('ot_verse', verse)
      .order('type')
      .limit(20)

    for (const row of data ?? []) {
      const book = BIBLE_BOOKS.find((b) => b.id === row.nt_book_id)
      if (!book) continue
      results.push({
        id: row.id,
        type: row.type as ConnectionType,
        note: row.note,
        ref: `${book.name} ${row.nt_chapter}:${row.nt_verse}`,
        book_name: book.name,
        chapter: row.nt_chapter,
        verse: row.nt_verse,
        direction: 'fulfillment',
      })
    }
  } else {
    // NT verse → find OT sources
    const { data } = await supabase
      .from('ot_nt_connections')
      .select('id, type, note, ot_book_id, ot_chapter, ot_verse')
      .eq('nt_book_id', book_id)
      .eq('nt_chapter', chapter)
      .eq('nt_verse', verse)
      .order('type')
      .limit(20)

    for (const row of data ?? []) {
      const book = BIBLE_BOOKS.find((b) => b.id === row.ot_book_id)
      if (!book) continue
      results.push({
        id: row.id,
        type: row.type as ConnectionType,
        note: row.note,
        ref: `${book.name} ${row.ot_chapter}:${row.ot_verse}`,
        book_name: book.name,
        chapter: row.ot_chapter,
        verse: row.ot_verse,
        direction: 'source',
      })
    }
  }

  return NextResponse.json({ connections: results, isOT })
}