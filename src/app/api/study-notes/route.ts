import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bookId = parseInt(searchParams.get('book_id') ?? '0')
  const chapter = parseInt(searchParams.get('chapter') ?? '0')

  if (!bookId || !chapter) return NextResponse.json({ note: null })

  const { data: note } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .eq('chapter_number', chapter)
    .single()

  return NextResponse.json({ note: note ?? null })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { book_id, chapter_number, content } = await request.json()
  if (!book_id || !chapter_number) {
    return NextResponse.json({ error: 'book_id and chapter_number required' }, { status: 400 })
  }

  const { data: note, error } = await supabase
    .from('study_notes')
    .upsert(
      { user_id: user.id, book_id, chapter_number, content: content ?? '' },
      { onConflict: 'user_id,book_id,chapter_number' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bookId = parseInt(searchParams.get('book_id') ?? '0')
  const chapter = parseInt(searchParams.get('chapter') ?? '0')

  await supabase
    .from('study_notes')
    .delete()
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .eq('chapter_number', chapter)

  return NextResponse.json({ ok: true })
}
