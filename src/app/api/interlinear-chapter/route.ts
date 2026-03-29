import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export interface TaggedWord {
  word: string
  original: string
  number: string
  transliteration: string
  brief: string
}

export async function POST(request: NextRequest) {
  const { book_id, chapter, translation, testament } = await request.json()

  const supabase = await createClient()

  // Resolve translation code → id
  const { data: translationRow } = await supabase
    .from('translations')
    .select('id')
    .eq('code', translation)
    .single()

  if (!translationRow) {
    return NextResponse.json({ error: 'Unknown translation' }, { status: 404 })
  }

  const { data: verses } = await supabase
    .from('verses')
    .select('verse_number, text')
    .eq('book_id', book_id)
    .eq('chapter_number', chapter)
    .eq('translation_id', translationRow.id)
    .order('verse_number')

  if (!verses?.length) {
    return NextResponse.json({ error: 'No verses found' }, { status: 404 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const isOT = testament === 'OT' || testament === 'Old'
  const lang = isOT ? 'Hebrew' : 'Greek'
  const numPrefix = isOT ? 'H' : 'G'

  // Batch into groups of 30 for very long chapters (e.g. Psalm 119)
  const batchSize = 30
  const allWords: Record<number, TaggedWord[]> = {}

  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize)
    const verseList = batch.map((v) => `${v.verse_number}: ${v.text}`).join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
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
    // Strip any markdown code fences Claude may wrap the JSON in
    const clean = raw
      .replace(/^```[a-z]*\r?\n?/, '')
      .replace(/\r?\n?```$/, '')
      .trim()

    try {
      const parsed = JSON.parse(clean)
      // Accept either { "1": [...], "2": [...] } or fallback array
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          const num = parseInt(k, 10)
          if (!isNaN(num) && Array.isArray(v)) {
            allWords[num] = v as TaggedWord[]
          }
        }
      }
    } catch {
      // Skip failed batch; those verses will fall back to plain text
    }
  }

  return NextResponse.json({ verses: allWords })
}
