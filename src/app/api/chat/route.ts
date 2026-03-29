import { NextRequest } from 'next/server'
import { getSystemPromptForDepth, type StudyDepth } from '@/lib/claude'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const { messages, currentPassage, depth } = await request.json()

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
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

  // Return a ReadableStream that the client can consume
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
