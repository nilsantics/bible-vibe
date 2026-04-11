import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BIBLE_BOOKS } from '@/lib/bible-data'
import Anthropic from '@anthropic-ai/sdk'
import { getTraditionPrompt, type TraditionId } from '@/lib/tradition'

export const runtime = 'edge'

const client = new Anthropic()

// ─── POST /api/commentary — RAG verse commentary ─────────────────────────────
// Embeds the verse, pulls top Matthew Henry chunks, synthesises via Claude.
export async function POST(request: NextRequest) {
  const { verseRef, verseText, bookId, chapter, verse, tradition } =
    await request.json()

  if (!verseRef || !verseText) {
    return new Response(JSON.stringify({ error: 'verseRef and verseText required' }), {
      status: 400,
    })
  }

  // 1. Embed the verse text with OpenAI
  const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: verseText }),
  })

  if (!embedRes.ok) {
    return new Response(JSON.stringify({ error: 'Embedding failed' }), { status: 502 })
  }
  const { data: embedData } = await embedRes.json()
  const embedding: number[] = embedData[0].embedding

  // 2. Semantic search over commentary_chunks (bias toward same book)
  const supabase = await createClient()
  const { data: chunks } = await supabase.rpc('search_commentary', {
    query_embedding: embedding,
    p_book_id: bookId ?? null,
    p_chapter: null,       // don't restrict to same chapter — thematic matches are fine
    match_count: 5,
  })

  // 3. Also fetch exact Matthew Henry for this specific verse/chapter
  const { data: direct } = await supabase
    .from('commentary_chunks')
    .select('source, book_id, chapter, verse_start, verse_end, content')
    .eq('source', 'matthew-henry')
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .lte('verse_start', verse ?? 1)
    .gte('verse_end', verse ?? 1)
    .limit(2)

  // Merge direct hits first, then semantic, deduplicate by id
  const seen = new Set<number>()
  const allChunks = [...(direct ?? []), ...((chunks as { id: number; content: string; source: string }[]) ?? [])]
    .filter((c) => {
      if (seen.has((c as { id?: number }).id ?? -1)) return false
      seen.add((c as { id?: number }).id ?? -1)
      return true
    })
    .slice(0, 4)

  const traditionSuffix = tradition ? getTraditionPrompt(tradition as TraditionId) : ''

  const sourceBlock =
    allChunks.length > 0
      ? allChunks
          .map(
            (c, i) =>
              `[Source ${i + 1} — ${c.source === 'matthew-henry' ? 'Matthew Henry Concise Commentary' : c.source}]\n${c.content}`,
          )
          .join('\n\n')
      : 'No commentary sources found in library.'

  // 4. Stream Claude synthesis
  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system:
      'You are a scholarly Bible study assistant with access to historical commentaries. Synthesise the provided sources into a clear, insightful commentary. Cite the source by name when you use it. Keep the tone warm but academically grounded.',
    messages: [
      {
        role: 'user',
        content: `Verse: ${verseRef} — "${verseText}"

Commentary sources from the library:
${sourceBlock}

Based on these sources, write a concise commentary on this verse. Explain its meaning, historical context, and spiritual significance. If the sources are relevant, integrate them naturally. Keep under 200 words.${traditionSuffix}`,
      },
    ],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}

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
