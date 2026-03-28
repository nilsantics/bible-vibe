import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notes: [] })

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('book')
  const chapter = searchParams.get('chapter')

  let query = supabase
    .from('notes')
    .select('*, verses!inner(book_id, chapter_number, verse_number)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (bookId && chapter) {
    query = query
      .eq('verses.book_id', bookId)
      .eq('verses.chapter_number', chapter)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { verse_id, content } = await request.json()
  if (!verse_id || !content) {
    return NextResponse.json({ error: 'verse_id and content required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: user.id, verse_id, content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, content } = await request.json()
  if (!id || !content) {
    return NextResponse.json({ error: 'id and content required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
