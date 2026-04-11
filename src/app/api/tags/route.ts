import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/tags?verse_id=123
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ tags: [] })

  const verseId = request.nextUrl.searchParams.get('verse_id')
  if (!verseId) {
    // Return all tags for the user (for display in study history)
    const { data } = await supabase
      .from('verse_tags')
      .select('id, verse_id, tag_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return NextResponse.json({ tags: data ?? [] })
  }

  const { data } = await supabase
    .from('verse_tags')
    .select('id, tag_name')
    .eq('user_id', user.id)
    .eq('verse_id', parseInt(verseId))
  return NextResponse.json({ tags: data ?? [] })
}

// POST /api/tags  { verse_id, tag_name }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { verse_id, tag_name } = await request.json()
  if (!verse_id || !tag_name?.trim()) {
    return NextResponse.json({ error: 'verse_id and tag_name required' }, { status: 400 })
  }

  const clean = tag_name.trim().toLowerCase().slice(0, 40)

  // Prevent duplicate tags on same verse
  const { data: existing } = await supabase
    .from('verse_tags')
    .select('id')
    .eq('user_id', user.id)
    .eq('verse_id', verse_id)
    .eq('tag_name', clean)
    .single()

  if (existing) return NextResponse.json({ tag: existing })

  const { data, error } = await supabase
    .from('verse_tags')
    .insert({ user_id: user.id, verse_id, tag_name: clean })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tag: data })
}

// DELETE /api/tags?id=123
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await supabase
    .from('verse_tags')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
