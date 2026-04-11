import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface PatristicWritingMeta {
  id: string
  slug: string
  father_name: string
  title: string
  era: string | null
  tradition: string | null
  total_sections: number
}

// GET /api/patristic-writings
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patristic_writings')
    .select('id, slug, father_name, title, era, tradition, total_sections')
    .order('era')

  if (error) return NextResponse.json({ writings: [] })
  return NextResponse.json({ writings: data ?? [] })
}
