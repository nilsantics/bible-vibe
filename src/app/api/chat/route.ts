import { NextRequest } from 'next/server'
import { getSystemPromptForDepth, type StudyDepth } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { checkChatRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorResponse('Sign in to chat with Ezra.', 401)

  // Rate limit — protect Sonnet budget
  const rate = await checkChatRateLimit(user.id)
  if (!rate.allowed) return errorResponse(rate.message!, 429)

  const { messages, currentPassage, depth } = await request.json()

  if (!messages || !Array.isArray(messages)) {
    return errorResponse('messages array required', 400)
  }

  const systemPrompt = getSystemPromptForDepth(depth ?? 'standard')
  const systemAddendum = currentPassage
    ? `\n\nThe user is currently reading: ${currentPassage}. Reference this passage when relevant.`
    : ''

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const maxTokens = depth === 'scholar' ? 900 : depth === 'simple' ? 400 : 650

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt + systemAddendum,
    messages,
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
      ...(rate.remaining !== undefined && { 'X-RateLimit-Remaining': String(rate.remaining) }),
    },
  })
}
