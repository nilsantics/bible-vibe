import { NextRequest } from 'next/server'
import { BIBLE_STUDY_SYSTEM_PROMPT, CLAUDE_MODEL } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Sign in to access historical context.', 401)

  const limit = await checkFeatureRateLimit(user.id)
  if (!limit.allowed) return err(limit.message!, 429)

  const { bookName, chapter, verseText } = await request.json()
  if (!bookName || !verseText) {
    return new Response(JSON.stringify({ error: 'bookName and verseText required' }), { status: 400 })
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Provide Ancient Near Eastern and historical context for ${bookName} ${chapter}, focusing on: "${verseText}"

Cover in 150–200 words using **bold headers** for each section:

**Historical Setting** — period, author, audience
**Cultural Context** — ANE customs, practices, or parallels relevant to this verse
**Geographic/Political** — location or power dynamics if relevant
**Original Meaning** — what a first-century or original reader would have understood

Be specific and scholarly but accessible. Use markdown.`,
      },
    ],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
