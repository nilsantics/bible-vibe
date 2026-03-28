import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/verses?book=1&chapter=1&translation=WEB
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('book')
  const chapter = searchParams.get('chapter')
  const translation = searchParams.get('translation') ?? 'WEB'

  if (!bookId || !chapter) {
    return NextResponse.json({ error: 'book and chapter are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: verses, error } = await supabase
    .from('verses')
    .select(
      `id, book_id, chapter_number, verse_number, text,
       translations!inner(code)`
    )
    .eq('book_id', bookId)
    .eq('chapter_number', chapter)
    .eq('translations.code', translation)
    .order('verse_number')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ verses })
}
