import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/highlights?book=1&chapter=1
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ highlights: [] })

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('book')
  const chapter = searchParams.get('chapter')

  let query = supabase
    .from('highlights')
    .select('*, verses!inner(book_id, chapter_number, verse_number)')
    .eq('user_id', user.id)

  if (bookId && chapter) {
    query = query
      .eq('verses.book_id', bookId)
      .eq('verses.chapter_number', chapter)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ highlights: data })
}

// POST /api/highlights — upsert a highlight
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { verse_id, color } = await request.json()
  if (!verse_id) return NextResponse.json({ error: 'verse_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('highlights')
    .upsert(
      { user_id: user.id, verse_id, color: color ?? 'yellow' },
      { onConflict: 'user_id,verse_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ highlight: data })
}

// DELETE /api/highlights?verse_id=123
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const verseId = searchParams.get('verse_id')
  if (!verseId) return NextResponse.json({ error: 'verse_id required' }, { status: 400 })

  const { error } = await supabase
    .from('highlights')
    .delete()
    .eq('user_id', user.id)
    .eq('verse_id', verseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
