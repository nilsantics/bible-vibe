/**
 * Seed all 66 Bible book overviews via Claude.
 * Run once: node scripts/seed-book-overviews.mjs
 *
 * Requires env vars: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BIBLE_BOOKS = [
  { id: 1,  name: 'Genesis',          testament: 'Old' },
  { id: 2,  name: 'Exodus',           testament: 'Old' },
  { id: 3,  name: 'Leviticus',        testament: 'Old' },
  { id: 4,  name: 'Numbers',          testament: 'Old' },
  { id: 5,  name: 'Deuteronomy',      testament: 'Old' },
  { id: 6,  name: 'Joshua',           testament: 'Old' },
  { id: 7,  name: 'Judges',           testament: 'Old' },
  { id: 8,  name: 'Ruth',             testament: 'Old' },
  { id: 9,  name: '1 Samuel',         testament: 'Old' },
  { id: 10, name: '2 Samuel',         testament: 'Old' },
  { id: 11, name: '1 Kings',          testament: 'Old' },
  { id: 12, name: '2 Kings',          testament: 'Old' },
  { id: 13, name: '1 Chronicles',     testament: 'Old' },
  { id: 14, name: '2 Chronicles',     testament: 'Old' },
  { id: 15, name: 'Ezra',             testament: 'Old' },
  { id: 16, name: 'Nehemiah',         testament: 'Old' },
  { id: 17, name: 'Esther',           testament: 'Old' },
  { id: 18, name: 'Job',              testament: 'Old' },
  { id: 19, name: 'Psalms',           testament: 'Old' },
  { id: 20, name: 'Proverbs',         testament: 'Old' },
  { id: 21, name: 'Ecclesiastes',     testament: 'Old' },
  { id: 22, name: 'Song of Songs',    testament: 'Old' },
  { id: 23, name: 'Isaiah',           testament: 'Old' },
  { id: 24, name: 'Jeremiah',         testament: 'Old' },
  { id: 25, name: 'Lamentations',     testament: 'Old' },
  { id: 26, name: 'Ezekiel',          testament: 'Old' },
  { id: 27, name: 'Daniel',           testament: 'Old' },
  { id: 28, name: 'Hosea',            testament: 'Old' },
  { id: 29, name: 'Joel',             testament: 'Old' },
  { id: 30, name: 'Amos',             testament: 'Old' },
  { id: 31, name: 'Obadiah',          testament: 'Old' },
  { id: 32, name: 'Jonah',            testament: 'Old' },
  { id: 33, name: 'Micah',            testament: 'Old' },
  { id: 34, name: 'Nahum',            testament: 'Old' },
  { id: 35, name: 'Habakkuk',         testament: 'Old' },
  { id: 36, name: 'Zephaniah',        testament: 'Old' },
  { id: 37, name: 'Haggai',           testament: 'Old' },
  { id: 38, name: 'Zechariah',        testament: 'Old' },
  { id: 39, name: 'Malachi',          testament: 'Old' },
  { id: 40, name: 'Matthew',          testament: 'New' },
  { id: 41, name: 'Mark',             testament: 'New' },
  { id: 42, name: 'Luke',             testament: 'New' },
  { id: 43, name: 'John',             testament: 'New' },
  { id: 44, name: 'Acts',             testament: 'New' },
  { id: 45, name: 'Romans',           testament: 'New' },
  { id: 46, name: '1 Corinthians',    testament: 'New' },
  { id: 47, name: '2 Corinthians',    testament: 'New' },
  { id: 48, name: 'Galatians',        testament: 'New' },
  { id: 49, name: 'Ephesians',        testament: 'New' },
  { id: 50, name: 'Philippians',      testament: 'New' },
  { id: 51, name: 'Colossians',       testament: 'New' },
  { id: 52, name: '1 Thessalonians',  testament: 'New' },
  { id: 53, name: '2 Thessalonians',  testament: 'New' },
  { id: 54, name: '1 Timothy',        testament: 'New' },
  { id: 55, name: '2 Timothy',        testament: 'New' },
  { id: 56, name: 'Titus',            testament: 'New' },
  { id: 57, name: 'Philemon',         testament: 'New' },
  { id: 58, name: 'Hebrews',          testament: 'New' },
  { id: 59, name: 'James',            testament: 'New' },
  { id: 60, name: '1 Peter',          testament: 'New' },
  { id: 61, name: '2 Peter',          testament: 'New' },
  { id: 62, name: '1 John',           testament: 'New' },
  { id: 63, name: '2 John',           testament: 'New' },
  { id: 64, name: '3 John',           testament: 'New' },
  { id: 65, name: 'Jude',             testament: 'New' },
  { id: 66, name: 'Revelation',       testament: 'New' },
]

async function generateOverview(bookName, testament) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Generate a scholarly overview of the biblical book of ${bookName} (${testament} Testament).

Return ONLY a valid JSON object with this exact shape:
{
  "author": "Traditional/likely author and brief note on authorship debates",
  "date_written": "Date range and era (e.g. 'c. 960–930 BC, Solomon\\'s reign')",
  "audience": "Original recipients and their situation",
  "purpose": "One sentence: why was this book written?",
  "summary": "2-3 sentence overview of the book's content and theological significance",
  "key_themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"],
  "outline": [
    { "range": "1:1–2:3", "title": "Section title" }
  ],
  "key_verses": [
    { "ref": "chapter:verse", "text": "The actual verse text (WEB translation)" }
  ]
}

Rules:
- outline: 4–8 sections covering the whole book
- key_verses: 3–5 of the most important/famous verses with their actual text
- key_themes: exactly 5 themes
- Return ONLY the JSON, no markdown fences, no explanation`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('No JSON in response')
  return JSON.parse(raw.slice(start, end + 1))
}

async function main() {
  console.log(`Seeding book overviews for all ${BIBLE_BOOKS.length} books...\n`)

  // Fetch already-seeded books
  const { data: existing } = await supabase.from('book_overviews').select('book_id')
  const seededIds = new Set((existing ?? []).map((r) => r.book_id))
  const todo = BIBLE_BOOKS.filter((b) => !seededIds.has(b.id))

  if (todo.length === 0) {
    console.log('All books already seeded!')
    return
  }

  console.log(`${seededIds.size} already done. Generating ${todo.length} remaining...\n`)

  for (const book of todo) {
    try {
      process.stdout.write(`  ${book.name}... `)
      const overview = await generateOverview(book.name, book.testament)

      const { error } = await supabase.from('book_overviews').upsert({
        book_id:      book.id,
        book_name:    book.name,
        author:       overview.author,
        date_written: overview.date_written,
        audience:     overview.audience,
        purpose:      overview.purpose,
        summary:      overview.summary,
        key_themes:   overview.key_themes,
        outline:      overview.outline,
        key_verses:   overview.key_verses,
      })

      if (error) throw error
      console.log('✓')

      // Avoid rate limits
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`)
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
