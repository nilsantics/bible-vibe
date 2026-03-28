import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const book_id = parseInt(searchParams.get('book_id') ?? '0')
  const chapter = parseInt(searchParams.get('chapter') ?? '0')
  const verse = parseInt(searchParams.get('verse') ?? '0')

  if (!book_id || !chapter || !verse) {
    return new Response('Missing params', { status: 400 })
  }

  const supabase = await createClient()

  const cacheSource = `devotional-v${verse}`

  // Check cache first
  const { data: cached } = await supabase
    .from('commentaries')
    .select('content')
    .eq('source', cacheSource)
    .eq('book_id', book_id)
    .eq('chapter', chapter)
    .single()

  if (cached?.content) {
    return new Response(cached.content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Cache': 'HIT',
      },
    })
  }

  // Get verse text
  const { data: verseRow } = await supabase
    .from('verses')
    .select('text, book_id, chapter_number, verse_number')
    .eq('book_id', book_id)
    .eq('chapter_number', chapter)
    .eq('verse_number', verse)
    .eq('translation_id', 1)
    .single()

  if (!verseRow) {
    return new Response('Verse not found', { status: 404 })
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = `Write a short, warm, and encouraging daily devotional (200-250 words) based on this verse:

"${verseRow.text}"

Structure it as:
**Reflection** — 2-3 sentences unpacking the verse's meaning in accessible, personal language
**Ancient insight** — 1-2 sentences on what this meant to the original readers
**For today** — 1-2 sentences connecting it to daily life
**Prayer** — A brief 1-2 sentence prayer the reader can make their own

Keep the tone warm, non-denominational, and accessible to all Christians. Do not use Christian jargon without explanation. Do not be preachy.`

  let fullContent = ''

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullContent += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        // Cache it
        if (fullContent) {
          void supabase.from('commentaries').upsert({
            source: cacheSource,
            book_id,
            chapter,
            content: fullContent,
          }, { onConflict: 'source,book_id,chapter' })
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Cache': 'MISS',
    },
  })
}
