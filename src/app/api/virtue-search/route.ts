import { NextRequest } from 'next/server'
import { CLAUDE_MODEL } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Sign in to use verse discovery.', 401)

  const limit = await checkFeatureRateLimit(user.id)
  if (!limit.allowed) return err(limit.message!, 429)

  const { goal } = await request.json()
  if (!goal?.trim()) return err('goal required', 400)

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `A Christian wants to find Bible passages related to: "${goal}"

Your task: find 10–12 passages that address this topic or virtue — including passages that DON'T use the exact word but embody the principle. This is the key: surface the non-obvious connections.

Examples of what this means:
- "courage" → include Joshua 1:6 ("Be strong and courageous") even though it's framed as leadership
- "patience" → include Romans 5:3-4 (suffering producing perseverance) even though the surface topic is suffering
- "leadership" → include Nehemiah 1-2 (prayer then strategic action) even though it's a historical narrative
- "anxiety" → include Philippians 4:6-7 AND Matthew 6:25-27 AND Psalm 23 (different angles on the same need)

Include a mix: well-known verses AND less-obvious passages. Both OT and NT where relevant.

Return ONLY a JSON array:
[
  {
    "book": "Joshua",
    "chapter": 1,
    "verse": 6,
    "ref": "Joshua 1:6",
    "snippet": "Be strong and courageous, for you shall cause this people to inherit the land that I swore to their fathers to give them.",
    "why": "God's command here isn't about feeling brave — it's about acting in obedience despite fear. This reframes courage as faithfulness rather than emotion, making it accessible even when you don't feel courageous."
  }
]

Rules:
- "snippet": a short accurate quote from the verse (WEB translation preferred, 1-2 sentences max)
- "why": 2 sentences explaining HOW this passage addresses the goal — be specific, not generic. Name what the passage actually says.
- Include surprising passages — don't just return the top 10 Google results
- Return ONLY valid JSON array, no markdown, no explanation outside the JSON`
    }]
  })

  try {
    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    const results = start !== -1 && end > start ? JSON.parse(raw.slice(start, end + 1)) : []
    return Response.json({ results })
  } catch {
    return err('Failed to parse results', 500)
  }
}
