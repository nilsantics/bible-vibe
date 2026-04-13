import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/study-notes            → all notes for user
// GET /api/study-notes?id=xxx     → single note
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const { data: note } = await supabase
      .from('study_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', id)
      .single()
    return NextResponse.json({ note: note ?? null })
  }

  const { data: notes } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return NextResponse.json({ notes: notes ?? [] })
}

// POST /api/study-notes   body: { title, content, book_id?, chapter_number?, book_name? }
//   → creates a new note and returns it
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, book_id, chapter_number, book_name } = await request.json()

  const { data: note, error } = await supabase
    .from('study_notes')
    .insert({
      user_id: user.id,
      title: title ?? 'Untitled Note',
      content: content ?? '',
      book_id: book_id ?? null,
      chapter_number: chapter_number ?? null,
      book_name: book_name ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note })
}

// PATCH /api/study-notes  body: { id, title?, content? }
//   → updates title and/or content
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, title, content } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content

  const { data: note, error } = await supabase
    .from('study_notes')
    .update(updates)
    .eq('user_id', user.id)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note })
}

// DELETE /api/study-notes?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await supabase
    .from('study_notes')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
