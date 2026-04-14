import { NextRequest } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureRateLimit } from '@/lib/rate-limit'
import { logAIUsage } from '@/lib/usage-log'

// Node runtime — longer timeout, needed for Claude response time
export const maxDuration = 60

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
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `A Christian wants to find Bible passages related to: "${goal}"

Find 8–10 passages that address this topic. Key priorities:

1. **Narrative first**: The Bible is ~60% poetry and narrative, ~10% prose. Prioritize stories and poems over epistles. For "patience," show Job, Joseph, Habakkuk — not just Romans 5. For "courage," show Gideon in Judges 6-7 or Esther. Stories and poems are easier to internalize than abstract teaching.

2. **Non-obvious connections**: Include passages that embody the principle without using the keyword. "Courage" → Joshua 1:6. "Patience" → Lamentations 3:25-26. "Leadership" → Nehemiah 1-2 (prayer then strategy). "God's sovereignty" → Genesis 50:20 (Joseph's story reveals it without defining it).

3. **Mix of well-known and surprising**: At least 3 should be passages people wouldn't immediately think of.

4. **Both OT and NT** where relevant.

Return ONLY a JSON array:
[
  {
    "book": "Joshua",
    "chapter": 1,
    "verse": 6,
    "ref": "Joshua 1:6",
    "snippet": "Be strong and courageous, for you shall cause this people to inherit the land that I swore to their fathers.",
    "why": "God doesn't ask Joshua to feel brave — he commands action in spite of fear. Courage here is framed as obedience, not emotion, which makes it accessible even when you don't feel courageous.",
    "type": "narrative"
  }
]

Rules:
- "snippet": short accurate quote, WEB translation preferred, 1-2 sentences
- "why": 2 sentences explaining HOW this passage addresses the goal — name what it actually says
- "type": one of "narrative", "poetry", "teaching", "prophecy"
- Return ONLY valid JSON array, no markdown`
    }]
  })

  logAIUsage({ userId: user.id, route: '/api/virtue-search', feature: 'verse_discovery', model: CLAUDE_HAIKU_MODEL, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens })

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
