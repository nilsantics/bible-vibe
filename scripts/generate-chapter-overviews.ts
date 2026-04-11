/**
 * Run: npm run generate:chapters
 *
 * Generates chapter overviews for all 1,189 chapters using Claude Haiku.
 * Skips chapters already in the DB. Safe to re-run.
 *
 * Set env vars: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BIBLE_BOOKS = [
  { id: 1,  name: 'Genesis',          chapters: 50 },
  { id: 2,  name: 'Exodus',           chapters: 40 },
  { id: 3,  name: 'Leviticus',        chapters: 27 },
  { id: 4,  name: 'Numbers',          chapters: 36 },
  { id: 5,  name: 'Deuteronomy',      chapters: 34 },
  { id: 6,  name: 'Joshua',           chapters: 24 },
  { id: 7,  name: 'Judges',           chapters: 21 },
  { id: 8,  name: 'Ruth',             chapters: 4  },
  { id: 9,  name: '1 Samuel',         chapters: 31 },
  { id: 10, name: '2 Samuel',         chapters: 24 },
  { id: 11, name: '1 Kings',          chapters: 22 },
  { id: 12, name: '2 Kings',          chapters: 25 },
  { id: 13, name: '1 Chronicles',     chapters: 29 },
  { id: 14, name: '2 Chronicles',     chapters: 36 },
  { id: 15, name: 'Ezra',             chapters: 10 },
  { id: 16, name: 'Nehemiah',         chapters: 13 },
  { id: 17, name: 'Esther',           chapters: 10 },
  { id: 18, name: 'Job',              chapters: 42 },
  { id: 19, name: 'Psalms',           chapters: 150},
  { id: 20, name: 'Proverbs',         chapters: 31 },
  { id: 21, name: 'Ecclesiastes',     chapters: 12 },
  { id: 22, name: 'Song of Songs',    chapters: 8  },
  { id: 23, name: 'Isaiah',           chapters: 66 },
  { id: 24, name: 'Jeremiah',         chapters: 52 },
  { id: 25, name: 'Lamentations',     chapters: 5  },
  { id: 26, name: 'Ezekiel',          chapters: 48 },
  { id: 27, name: 'Daniel',           chapters: 12 },
  { id: 28, name: 'Hosea',            chapters: 14 },
  { id: 29, name: 'Joel',             chapters: 3  },
  { id: 30, name: 'Amos',             chapters: 9  },
  { id: 31, name: 'Obadiah',          chapters: 1  },
  { id: 32, name: 'Jonah',            chapters: 4  },
  { id: 33, name: 'Micah',            chapters: 7  },
  { id: 34, name: 'Nahum',            chapters: 3  },
  { id: 35, name: 'Habakkuk',         chapters: 3  },
  { id: 36, name: 'Zephaniah',        chapters: 3  },
  { id: 37, name: 'Haggai',           chapters: 2  },
  { id: 38, name: 'Zechariah',        chapters: 14 },
  { id: 39, name: 'Malachi',          chapters: 4  },
  { id: 40, name: 'Matthew',          chapters: 28 },
  { id: 41, name: 'Mark',             chapters: 16 },
  { id: 42, name: 'Luke',             chapters: 24 },
  { id: 43, name: 'John',             chapters: 21 },
  { id: 44, name: 'Acts',             chapters: 28 },
  { id: 45, name: 'Romans',           chapters: 16 },
  { id: 46, name: '1 Corinthians',    chapters: 16 },
  { id: 47, name: '2 Corinthians',    chapters: 13 },
  { id: 48, name: 'Galatians',        chapters: 6  },
  { id: 49, name: 'Ephesians',        chapters: 6  },
  { id: 50, name: 'Philippians',      chapters: 4  },
  { id: 51, name: 'Colossians',       chapters: 4  },
  { id: 52, name: '1 Thessalonians',  chapters: 5  },
  { id: 53, name: '2 Thessalonians',  chapters: 3  },
  { id: 54, name: '1 Timothy',        chapters: 6  },
  { id: 55, name: '2 Timothy',        chapters: 4  },
  { id: 56, name: 'Titus',            chapters: 3  },
  { id: 57, name: 'Philemon',         chapters: 1  },
  { id: 58, name: 'Hebrews',          chapters: 13 },
  { id: 59, name: 'James',            chapters: 5  },
  { id: 60, name: '1 Peter',          chapters: 5  },
  { id: 61, name: '2 Peter',          chapters: 3  },
  { id: 62, name: '1 John',           chapters: 5  },
  { id: 63, name: '2 John',           chapters: 1  },
  { id: 64, name: '3 John',           chapters: 1  },
  { id: 65, name: 'Jude',             chapters: 1  },
  { id: 66, name: 'Revelation',       chapters: 22 },
]

async function generateChapterOverview(bookName: string, chapterNum: number) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are a Bible scholar. Generate a brief chapter overview for ${bookName} chapter ${chapterNum}.

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence summary of what happens / is taught in this chapter",
  "key_ideas": ["idea 1", "idea 2", "idea 3"],
  "connections": "1 sentence noting any significant OT quotations in NT chapters, or NT fulfillments in OT chapters, or null if none notable"
}`,
    }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(raw)
}

async function main() {
  const { data: existing } = await supabase
    .from('chapter_overviews')
    .select('book_id, chapter_number')

  const existingSet = new Set(
    (existing ?? []).map((r: { book_id: number; chapter_number: number }) => `${r.book_id}_${r.chapter_number}`)
  )

  // Build full list
  const all: { bookId: number; bookName: string; chapter: number }[] = []
  for (const book of BIBLE_BOOKS) {
    for (let c = 1; c <= book.chapters; c++) {
      if (!existingSet.has(`${book.id}_${c}`)) {
        all.push({ bookId: book.id, bookName: book.name, chapter: c })
      }
    }
  }

  console.log(`Generating ${all.length} chapter overviews (${existingSet.size} already done)`)

  for (const { bookId, bookName, chapter } of all) {
    process.stdout.write(`  ${bookName} ${chapter}... `)
    try {
      const data = await generateChapterOverview(bookName, chapter)
      await supabase.from('chapter_overviews').upsert({
        book_id: bookId,
        chapter_number: chapter,
        summary: data.summary,
        key_ideas: data.key_ideas,
        connections: data.connections === 'null' ? null : data.connections,
      })
      console.log('done')
    } catch (err) {
      console.log(`ERROR: ${err}`)
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  console.log('\nAll done!')
}

main()
