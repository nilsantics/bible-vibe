import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/strongs?number=H1234
// GET /api/strongs?word=father&testament=OT   (search by English word)
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const number = params.get('number')
  const word = params.get('word')
  const testament = params.get('testament') // 'OT' or 'NT'

  const supabase = await createClient()

  if (number) {
    // Direct Strong's number lookup
    const { data, error } = await supabase
      .from('strongs_entries')
      .select('*')
      .eq('number', number.toUpperCase())
      .single()

    if (error || !data) return NextResponse.json({ entry: null })
    return NextResponse.json({ entry: data })
  }

  if (word) {
    // Search by word in KJV usage or definition
    let query = supabase
      .from('strongs_entries')
      .select('number, word, transliteration, pronunciation, definition, kjv_usage, testament')
      .or(`kjv_usage.ilike.%${word}%,definition.ilike.%${word}%`)
      .limit(8)

    if (testament) query = query.eq('testament', testament)

    const { data, error } = await query
    if (error) return NextResponse.json({ entries: [] })
    return NextResponse.json({ entries: data ?? [] })
  }

  return NextResponse.json({ error: 'number or word param required' }, { status: 400 })
}
