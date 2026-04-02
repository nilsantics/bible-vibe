import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/claude'

export interface TaggedWord {
  word: string
  original: string
  number: string
  transliteration: string
  brief: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  // Client passes verse texts directly — no DB lookup needed.
  // This works with ESV, BSB, WEB, KJV regardless of what's in Supabase.
  const { testament, translation, verses: clientVerses } = await request.json() as {
    testament: string
    translation: string
    verses: { verse_number: number; text: string }[]
  }

  if (!clientVerses?.length) {
    return NextResponse.json({ error: 'No verses provided' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const isOT = testament === 'OT' || testament === 'Old'
  const lang = isOT ? 'Hebrew' : 'Greek'
  const numPrefix = isOT ? 'H' : 'G'

  // Batch into groups of 5 — each verse ~15 words × 5 fields ≈ 400 tokens, so 5 = ~2000 tokens
  const batchSize = 5
  const allWords: Record<number, TaggedWord[]> = {}

  for (let i = 0; i < clientVerses.length; i += batchSize) {
    const batch = clientVerses.slice(i, i + batchSize)
    const verseList = batch.map((v) => `${v.verse_number}: ${v.text}`).join('\n')

    const response = await anthropic.messages.create({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Tag every word in these Bible verses (${translation}) with Strong's ${lang} concordance numbers.

${verseList}

Return a JSON object. Keys = verse numbers (as strings). Values = arrays of word objects.
Each object: {"word":"English word incl. punctuation","original":"${lang} script","number":"${numPrefix}XXXX","transliteration":"phonetic spelling","brief":"1-4 word definition"}

Rules:
- Include ALL words. For articles/conjunctions with no Strong's entry, use "" for original, number, transliteration.
- Include trailing punctuation in the "word" field (e.g. "earth," not "earth").
- Keep "brief" to 4 words or fewer.
- Return ONLY valid JSON, no markdown fences, no explanation.`,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
    // Extract outermost JSON object — handles markdown fences and preamble text
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    const clean = start !== -1 && end > start ? raw.slice(start, end + 1) : raw

    try {
      const parsed = JSON.parse(clean)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          const num = parseInt(k, 10)
          if (!isNaN(num) && Array.isArray(v)) {
            allWords[num] = v as TaggedWord[]
          }
        }
      }
    } catch {
      // Skip failed batch; those verses fall back to plain text
    }
  }

  return NextResponse.json({ verses: allWords })
}
