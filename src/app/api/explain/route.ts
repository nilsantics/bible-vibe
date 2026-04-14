import { NextRequest } from 'next/server'
import { BIBLE_STUDY_SYSTEM_PROMPT, CLAUDE_MODEL } from '@/lib/claude'
import { getTraditionPrompt, type TraditionId } from '@/lib/tradition'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Sign in to get verse explanations.', 401)

  const { verseRef, verseText, translation, tradition } = await request.json()
  if (!verseRef || !verseText) {
    return new Response(JSON.stringify({ error: 'verseRef and verseText required' }), { status: 400 })
  }

  const traditionSuffix = tradition ? getTraditionPrompt(tradition as TraditionId) : ''

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 700,
    system: BIBLE_STUDY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Explain ${verseRef} (${translation ?? 'WEB'}): "${verseText}"

Provide:
1. **Plain meaning** (1-2 sentences)
2. **Historical/ANE context** (2-3 sentences)
3. **Key word** — Pick the single most theologically significant Hebrew or Greek word in this verse. Format it exactly like this: the word in original script, Strong's number in parentheses, transliteration, then its definition drawn from Thayer's Greek Lexicon (NT) or Brown-Driver-Briggs (OT). Explain how the word's range of meaning illuminates this verse. 2-3 sentences. Example format: "The Greek ἀγάπη (G26, *agapē*) — Thayer's defines this as unconditional, self-giving love distinct from φιλέω..."
4. **Theological significance** (1-2 sentences)
5. **Application** — 1-2 sentences on how this verse speaks practically to a person's faith or daily life today.

Use markdown. Keep under 350 words.${traditionSuffix}`,
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
