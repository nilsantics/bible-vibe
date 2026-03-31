import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchESVChapter } from '@/lib/esv'
import { fetchBSBChapter } from '@/lib/bsb'
import { getBookById } from '@/lib/bible-data'

// GET /api/verses?book=1&chapter=1&translation=WEB
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookIdParam = searchParams.get('book')
  const chapterParam = searchParams.get('chapter')
  const translation = searchParams.get('translation') ?? 'WEB'

  if (!bookIdParam || !chapterParam) {
    return NextResponse.json({ error: 'book and chapter are required' }, { status: 400 })
  }

  const bookId = parseInt(bookIdParam, 10)
  const chapter = parseInt(chapterParam, 10)

  // ESV + BSB come from external APIs, not Supabase
  if (translation === 'ESV') {
    const book = getBookById(bookId)
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    try {
      const verses = await fetchESVChapter(book.name, chapter, bookId)
      return NextResponse.json({ verses })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 502 })
    }
  }

  if (translation === 'BSB') {
    try {
      const verses = await fetchBSBChapter(bookId, chapter)
      return NextResponse.json({ verses })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 502 })
    }
  }

  const supabase = await createClient()

  const { data: verses, error } = await supabase
    .from('verses')
    .select(
      `id, book_id, chapter_number, verse_number, text,
       translations!inner(code)`
    )
    .eq('book_id', bookIdParam)
    .eq('chapter_number', chapterParam)
    .eq('translations.code', translation)
    .order('verse_number')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ verses })
}
