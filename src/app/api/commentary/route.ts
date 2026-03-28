import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'edge'

const client = new Anthropic()

// GET /api/commentary?book_id=1&chapter=1
// Returns cached commentary or generates + caches via Claude streaming
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const book_id = parseInt(params.get('book_id') ?? '0')
  const chapter = parseInt(params.get('chapter') ?? '0')

  if (!book_id || !chapter) {
    return new Response('book_id and chapter required', { status: 400 })
  }

  const supabase = await createClient()
  const book = BIBLE_BOOKS.find((b) => b.id === book_id)
  if (!book) return new Response('Unknown book', { status: 404 })

  // Check cache first
  const { data: cached } = await supabase
    .from('commentaries')
    .select('content')
    .eq('source', 'ai')
    .eq('book_id', book_id)
    .eq('chapter', chapter)
    .single()

  if (cached?.content) {
    // Return cached as a stream for consistent client handling
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(cached.content))
        controller.close()
      },
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Cache': 'HIT',
      },
    })
  }

  // Generate with Claude and stream + cache
  const passage = `${book.name} ${chapter}`
  const prompt = `Write a concise Bible study commentary for ${passage}. Cover:

**Overview** — What is happening in this chapter? What is the main theme or narrative arc?

**Historical & Cultural Context** — What should readers understand about the historical setting, author, audience, or cultural background that illuminates this chapter?

**Key Verses** — Highlight 2–3 key verses with a brief explanation of each.

**Theological Significance** — What does this chapter reveal about God, humanity, salvation, or the overarching biblical story?

**Application** — What is the timeless truth or practical takeaway for readers today?

Be scholarly but accessible. Aim for 300–400 words.`

  let fullText = ''

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    system:
      'You are a scholarly Bible study guide. Write clear, historically grounded commentary that draws on ancient Near Eastern context and original language insights. Present denominational perspectives fairly.',
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text
          fullText += text
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()

      // Cache the completed result (fire-and-forget)
      void supabase
        .from('commentaries')
        .upsert(
          { source: 'ai', book_id, chapter, content: fullText },
          { onConflict: 'source,book_id,chapter' }
        )
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Cache': 'MISS',
    },
  })
}
