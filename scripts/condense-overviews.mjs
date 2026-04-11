import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const { data: books } = await supabase
  .from('book_overviews')
  .select('book_id, book_name, author, date_written, audience, purpose, summary')
  .order('book_id')

console.log(`Condensing ${books.length} books...\n`)

for (const book of books) {
  process.stdout.write(`  [${book.book_name}]... `)
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Condense these four fields for the Bible book "${book.book_name}" to be brief and scannable. Return ONLY valid JSON.

Current values:
- author: "${book.author}"
- date_written: "${book.date_written}"
- audience: "${book.audience}"
- purpose: "${book.purpose}"
- summary: "${book.summary}"

Rules:
- author: name + tradition note, max 10 words total (e.g. "Solomon, traditionally; debated by scholars")
- date_written: short date + era, max 8 words (e.g. "c. 960–930 BC, Solomon's reign")
- audience: brief noun phrase, max 8 words (e.g. "Post-exilic Jews rebuilding Jerusalem")
- purpose: one tight sentence, max 18 words
- summary: 2 sentences max, plain prose

Return JSON: {"author":"...","date_written":"...","audience":"...","purpose":"...","summary":"..."}`
      }]
    })

    const raw = msg.content[0].text
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) throw new Error('no JSON')
    const condensed = JSON.parse(raw.slice(start, end + 1))

    await supabase
      .from('book_overviews')
      .update({
        author:       condensed.author,
        date_written: condensed.date_written,
        audience:     condensed.audience,
        purpose:      condensed.purpose,
        summary:      condensed.summary,
        updated_at:   new Date().toISOString(),
      })
      .eq('book_id', book.book_id)

    console.log('✓')
  } catch (e) {
    console.log('✗', e.message)
  }
}

console.log('\nDone.')
