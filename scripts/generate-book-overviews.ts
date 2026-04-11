/**
 * Run: npx tsx scripts/generate-book-overviews.ts
 *
 * Generates book overviews for all 66 books of the Bible using Claude Haiku
 * and stores them in the Supabase book_overviews table.
 *
 * Skips books that already have an entry (safe to re-run).
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BIBLE_BOOKS = [
  { id: 1,  name: 'Genesis' },       { id: 2,  name: 'Exodus' },
  { id: 3,  name: 'Leviticus' },     { id: 4,  name: 'Numbers' },
  { id: 5,  name: 'Deuteronomy' },   { id: 6,  name: 'Joshua' },
  { id: 7,  name: 'Judges' },        { id: 8,  name: 'Ruth' },
  { id: 9,  name: '1 Samuel' },      { id: 10, name: '2 Samuel' },
  { id: 11, name: '1 Kings' },       { id: 12, name: '2 Kings' },
  { id: 13, name: '1 Chronicles' },  { id: 14, name: '2 Chronicles' },
  { id: 15, name: 'Ezra' },          { id: 16, name: 'Nehemiah' },
  { id: 17, name: 'Esther' },        { id: 18, name: 'Job' },
  { id: 19, name: 'Psalms' },        { id: 20, name: 'Proverbs' },
  { id: 21, name: 'Ecclesiastes' },  { id: 22, name: 'Song of Songs' },
  { id: 23, name: 'Isaiah' },        { id: 24, name: 'Jeremiah' },
  { id: 25, name: 'Lamentations' },  { id: 26, name: 'Ezekiel' },
  { id: 27, name: 'Daniel' },        { id: 28, name: 'Hosea' },
  { id: 29, name: 'Joel' },          { id: 30, name: 'Amos' },
  { id: 31, name: 'Obadiah' },       { id: 32, name: 'Jonah' },
  { id: 33, name: 'Micah' },         { id: 34, name: 'Nahum' },
  { id: 35, name: 'Habakkuk' },      { id: 36, name: 'Zephaniah' },
  { id: 37, name: 'Haggai' },        { id: 38, name: 'Zechariah' },
  { id: 39, name: 'Malachi' },
  { id: 40, name: 'Matthew' },       { id: 41, name: 'Mark' },
  { id: 42, name: 'Luke' },          { id: 43, name: 'John' },
  { id: 44, name: 'Acts' },          { id: 45, name: 'Romans' },
  { id: 46, name: '1 Corinthians' }, { id: 47, name: '2 Corinthians' },
  { id: 48, name: 'Galatians' },     { id: 49, name: 'Ephesians' },
  { id: 50, name: 'Philippians' },   { id: 51, name: 'Colossians' },
  { id: 52, name: '1 Thessalonians'},{ id: 53, name: '2 Thessalonians'},
  { id: 54, name: '1 Timothy' },     { id: 55, name: '2 Timothy' },
  { id: 56, name: 'Titus' },         { id: 57, name: 'Philemon' },
  { id: 58, name: 'Hebrews' },       { id: 59, name: 'James' },
  { id: 60, name: '1 Peter' },       { id: 61, name: '2 Peter' },
  { id: 62, name: '1 John' },        { id: 63, name: '2 John' },
  { id: 64, name: '3 John' },        { id: 65, name: 'Jude' },
  { id: 66, name: 'Revelation' },
]

async function generateOverview(bookName: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a Bible scholar. Generate a concise book overview for the book of ${bookName}.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "author": "string — human author and tradition (e.g. 'Moses, by tradition')",
  "date_written": "string — approximate date range (e.g. 'c. 1445–1405 BC')",
  "audience": "string — original audience (1 sentence)",
  "purpose": "string — the book's central purpose (1–2 sentences)",
  "key_themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "outline": [
    {"range": "1:1–11", "title": "Section title"},
    {"range": "1:12–50", "title": "Section title"}
  ],
  "key_verses": [
    {"ref": "1:1", "text": "First few words of the verse…"},
    {"ref": "3:16", "text": "First few words…"}
  ]
}

The outline should have 4–8 sections. Key verses should have 4–6 entries. Be scholarly but accessible.`,
    }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(raw)
}

async function main() {
  // Fetch already-generated books
  const { data: existing } = await supabase
    .from('book_overviews')
    .select('book_id')
  const existingIds = new Set((existing ?? []).map((r: { book_id: number }) => r.book_id))

  const toGenerate = BIBLE_BOOKS.filter((b) => !existingIds.has(b.id))
  console.log(`Generating ${toGenerate.length} book overviews (${existingIds.size} already done)`)

  for (const book of toGenerate) {
    process.stdout.write(`  ${book.name}... `)
    try {
      const overview = await generateOverview(book.name)
      await supabase.from('book_overviews').upsert({
        book_id: book.id,
        book_name: book.name,
        author: overview.author,
        date_written: overview.date_written,
        audience: overview.audience,
        purpose: overview.purpose,
        key_themes: overview.key_themes,
        outline: overview.outline,
        key_verses: overview.key_verses,
        updated_at: new Date().toISOString(),
      })
      console.log('done')
    } catch (err) {
      console.log(`ERROR: ${err}`)
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log('\nAll done!')
}

main()
