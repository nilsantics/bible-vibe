import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_HAIKU_MODEL } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export interface TaggedWord {
  word: string        // English word as it appears in the translation
  original: string   // Hebrew or Greek script
  number: string     // e.g. H7225 or G3056
  transliteration: string
  brief: string      // one-phrase meaning
}

// GET /api/strongs-verse?ref=Genesis+1:1&text=...&testament=OT
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to use the interlinear view.' }, { status: 401 })

  const params = request.nextUrl.searchParams
  const ref = params.get('ref') ?? ''
  const text = params.get('text') ?? ''
  const testament = params.get('testament') ?? 'OT' // 'OT' or 'NT'

  if (!ref || !text) {
    return NextResponse.json({ words: [] })
  }

  const langLabel = testament === 'NT' ? 'Greek (NT)' : 'Hebrew (OT)'
  const numberPrefix = testament === 'NT' ? 'G' : 'H'

  const prompt = `You are a biblical language expert. Tag every meaningful word in this Bible verse with its Strong's ${langLabel} number.

Verse: ${ref}
Text: "${text}"

Return a JSON array. Include every content word (nouns, verbs, adjectives, key prepositions). Skip articles ("the", "a"), conjunctions ("and", "but"), and minor filler words.

Each object must have exactly these keys:
- "word": the English word as it appears in the verse
- "original": the ${langLabel} script (actual characters)
- "number": Strong's number (e.g. "${numberPrefix}7225")
- "transliteration": romanized pronunciation
- "brief": a 2-5 word definition

Return ONLY a valid JSON array, no other text. Example format:
[{"word":"beginning","original":"בְּרֵאשִׁית","number":"H7225","transliteration":"re'shiyth","brief":"first, chief, beginning"}]`

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
    // Strip markdown fences, then find the JSON array
    const stripped = raw.replace(/^```[a-z]*\r?\n?/, '').replace(/\r?\n?```$/, '').trim()
    const start = stripped.indexOf('[')
    const end = stripped.lastIndexOf(']')
    const words: TaggedWord[] = start !== -1 && end > start
      ? JSON.parse(stripped.slice(start, end + 1))
      : []

    return NextResponse.json({ words })
  } catch {
    return NextResponse.json({ words: [] })
  }
}
