import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorResponse('Sign in to synthesize notes.', 401)

  const limit = await checkFeatureRateLimit(user.id)
  if (!limit.allowed) return errorResponse(limit.message!, 429)

  const { notes, bookName, chapter } = await request.json()
  if (!notes?.trim()) return errorResponse('notes content required', 400)

  const systemPrompt = `You are a biblical scholar and study guide. Your role is to enrich a student's personal Bible study notes with scholarly insights. Be concise, practical, and devotionally warm. Use markdown headers (##) for each section.`

  const userPrompt = `The student is studying ${bookName} chapter ${chapter}. Here are their personal study notes:

---
${notes}
---

Please enrich these notes with the following sections (only include sections that are relevant):

## Cross-References
List 3–5 key Bible passages that connect thematically or directly to what they've written. Include the reference and a one-sentence explanation of the connection.

## Historical & Cultural Context
Brief background that illuminates what they've noted — ANE customs, first-century context, author/audience details, etc.

## Thematic Connections
Recurring biblical themes, typology, or motifs visible in what they've observed.

## Theological Observations
Key doctrinal implications worth exploring further, grounded in what they wrote.

## Questions for Further Study
3–5 open questions to guide deeper investigation based on their notes.

Keep each section brief and targeted to their actual notes. Don't restate what they already wrote.`

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
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
            controller.enqueue(encoder.encode(event.delta.text))
          }
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
      'X-Accel-Buffering': 'no',
    },
  })
}
