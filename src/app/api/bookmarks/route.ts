import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id, folder, created_at,
      verses(id, book_id, chapter_number, verse_number, text,
        translations(code)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookmarks: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { verse_id, folder = 'default' } = await request.json()
  if (!verse_id) return NextResponse.json({ error: 'verse_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({ user_id: user.id, verse_id, folder }, { onConflict: 'user_id,verse_id,folder' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookmark: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const verse_id = request.nextUrl.searchParams.get('verse_id')
  if (!verse_id) return NextResponse.json({ error: 'verse_id required' }, { status: 400 })

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('verse_id', verse_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
