import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/search?q=...&type=text|semantic&translation=WEB
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') ?? 'text'
  const translation = searchParams.get('translation') ?? 'WEB'

  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 })
  }

  const supabase = await createClient()

  if (type === 'semantic') {
    // Semantic search: embed the query, then find nearest verse embeddings
    try {
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

      const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: q,
      })
      const queryEmbedding = embRes.data[0].embedding

      const { data, error } = await supabase.rpc('search_verses_semantic', {
        query_embedding: queryEmbedding,
        match_count: 20,
        translation,
      })

      if (error) throw error
      return NextResponse.json({ results: data ?? [] })
    } catch (err) {
      console.error('Semantic search error:', err)
      // Fall back to text search
    }
  }

  // Full-text search
  const { data, error } = await supabase.rpc('search_verses_text', {
    query_text: q,
    translation,
    limit_count: 25,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ results: data ?? [] })
}
