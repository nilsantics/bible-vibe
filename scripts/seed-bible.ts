/**
 * Bible Vibe — Bible Data Seed Script
 *
 * Downloads WEB (via NHEB, WEB-derived public domain) and KJV
 * from scrollmapper/bible_databases and loads them into Supabase.
 *
 * Run once:
 *   npx dotenv-cli -e .env.local -- npx ts-node --project tsconfig.scripts.json scripts/seed-bible.ts
 */

import { createClient } from '@supabase/supabase-js'

// ---- Config ---------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Scrollmapper format: { translation, books: [{ name, chapters: [{ chapter, verses: [{ verse, text }] }] }] }
const BIBLE_SOURCES: Record<string, string> = {
  WEB: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/NHEB.json',
  KJV: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json',
}

// ---- Helpers --------------------------------------------------

async function downloadJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const text = await res.text()
  // Strip UTF-8 BOM if present
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text
  return JSON.parse(clean)
}

// ---- Book metadata --------------------------------------------

const BOOKS = [
  { id: 1,  name: 'Genesis',          abbr: 'Gen',   testament: 'Old', chapters: 50,  order: 1 },
  { id: 2,  name: 'Exodus',           abbr: 'Exod',  testament: 'Old', chapters: 40,  order: 2 },
  { id: 3,  name: 'Leviticus',        abbr: 'Lev',   testament: 'Old', chapters: 27,  order: 3 },
  { id: 4,  name: 'Numbers',          abbr: 'Num',   testament: 'Old', chapters: 36,  order: 4 },
  { id: 5,  name: 'Deuteronomy',      abbr: 'Deut',  testament: 'Old', chapters: 34,  order: 5 },
  { id: 6,  name: 'Joshua',           abbr: 'Josh',  testament: 'Old', chapters: 24,  order: 6 },
  { id: 7,  name: 'Judges',           abbr: 'Judg',  testament: 'Old', chapters: 21,  order: 7 },
  { id: 8,  name: 'Ruth',             abbr: 'Ruth',  testament: 'Old', chapters: 4,   order: 8 },
  { id: 9,  name: '1 Samuel',         abbr: '1Sam',  testament: 'Old', chapters: 31,  order: 9 },
  { id: 10, name: '2 Samuel',         abbr: '2Sam',  testament: 'Old', chapters: 24,  order: 10 },
  { id: 11, name: '1 Kings',          abbr: '1Kgs',  testament: 'Old', chapters: 22,  order: 11 },
  { id: 12, name: '2 Kings',          abbr: '2Kgs',  testament: 'Old', chapters: 25,  order: 12 },
  { id: 13, name: '1 Chronicles',     abbr: '1Chr',  testament: 'Old', chapters: 29,  order: 13 },
  { id: 14, name: '2 Chronicles',     abbr: '2Chr',  testament: 'Old', chapters: 36,  order: 14 },
  { id: 15, name: 'Ezra',             abbr: 'Ezra',  testament: 'Old', chapters: 10,  order: 15 },
  { id: 16, name: 'Nehemiah',         abbr: 'Neh',   testament: 'Old', chapters: 13,  order: 16 },
  { id: 17, name: 'Esther',           abbr: 'Esth',  testament: 'Old', chapters: 10,  order: 17 },
  { id: 18, name: 'Job',              abbr: 'Job',   testament: 'Old', chapters: 42,  order: 18 },
  { id: 19, name: 'Psalms',           abbr: 'Ps',    testament: 'Old', chapters: 150, order: 19 },
  { id: 20, name: 'Proverbs',         abbr: 'Prov',  testament: 'Old', chapters: 31,  order: 20 },
  { id: 21, name: 'Ecclesiastes',     abbr: 'Eccl',  testament: 'Old', chapters: 12,  order: 21 },
  { id: 22, name: 'Song of Songs',    abbr: 'Song',  testament: 'Old', chapters: 8,   order: 22 },
  { id: 23, name: 'Isaiah',           abbr: 'Isa',   testament: 'Old', chapters: 66,  order: 23 },
  { id: 24, name: 'Jeremiah',         abbr: 'Jer',   testament: 'Old', chapters: 52,  order: 24 },
  { id: 25, name: 'Lamentations',     abbr: 'Lam',   testament: 'Old', chapters: 5,   order: 25 },
  { id: 26, name: 'Ezekiel',          abbr: 'Ezek',  testament: 'Old', chapters: 48,  order: 26 },
  { id: 27, name: 'Daniel',           abbr: 'Dan',   testament: 'Old', chapters: 12,  order: 27 },
  { id: 28, name: 'Hosea',            abbr: 'Hos',   testament: 'Old', chapters: 14,  order: 28 },
  { id: 29, name: 'Joel',             abbr: 'Joel',  testament: 'Old', chapters: 3,   order: 29 },
  { id: 30, name: 'Amos',             abbr: 'Amos',  testament: 'Old', chapters: 9,   order: 30 },
  { id: 31, name: 'Obadiah',          abbr: 'Obad',  testament: 'Old', chapters: 1,   order: 31 },
  { id: 32, name: 'Jonah',            abbr: 'Jonah', testament: 'Old', chapters: 4,   order: 32 },
  { id: 33, name: 'Micah',            abbr: 'Mic',   testament: 'Old', chapters: 7,   order: 33 },
  { id: 34, name: 'Nahum',            abbr: 'Nah',   testament: 'Old', chapters: 3,   order: 34 },
  { id: 35, name: 'Habakkuk',         abbr: 'Hab',   testament: 'Old', chapters: 3,   order: 35 },
  { id: 36, name: 'Zephaniah',        abbr: 'Zeph',  testament: 'Old', chapters: 3,   order: 36 },
  { id: 37, name: 'Haggai',           abbr: 'Hag',   testament: 'Old', chapters: 2,   order: 37 },
  { id: 38, name: 'Zechariah',        abbr: 'Zech',  testament: 'Old', chapters: 14,  order: 38 },
  { id: 39, name: 'Malachi',          abbr: 'Mal',   testament: 'Old', chapters: 4,   order: 39 },
  { id: 40, name: 'Matthew',          abbr: 'Matt',  testament: 'New', chapters: 28,  order: 40 },
  { id: 41, name: 'Mark',             abbr: 'Mark',  testament: 'New', chapters: 16,  order: 41 },
  { id: 42, name: 'Luke',             abbr: 'Luke',  testament: 'New', chapters: 24,  order: 42 },
  { id: 43, name: 'John',             abbr: 'John',  testament: 'New', chapters: 21,  order: 43 },
  { id: 44, name: 'Acts',             abbr: 'Acts',  testament: 'New', chapters: 28,  order: 44 },
  { id: 45, name: 'Romans',           abbr: 'Rom',   testament: 'New', chapters: 16,  order: 45 },
  { id: 46, name: '1 Corinthians',    abbr: '1Cor',  testament: 'New', chapters: 16,  order: 46 },
  { id: 47, name: '2 Corinthians',    abbr: '2Cor',  testament: 'New', chapters: 13,  order: 47 },
  { id: 48, name: 'Galatians',        abbr: 'Gal',   testament: 'New', chapters: 6,   order: 48 },
  { id: 49, name: 'Ephesians',        abbr: 'Eph',   testament: 'New', chapters: 6,   order: 49 },
  { id: 50, name: 'Philippians',      abbr: 'Phil',  testament: 'New', chapters: 4,   order: 50 },
  { id: 51, name: 'Colossians',       abbr: 'Col',   testament: 'New', chapters: 4,   order: 51 },
  { id: 52, name: '1 Thessalonians',  abbr: '1Th',   testament: 'New', chapters: 5,   order: 52 },
  { id: 53, name: '2 Thessalonians',  abbr: '2Th',   testament: 'New', chapters: 3,   order: 53 },
  { id: 54, name: '1 Timothy',        abbr: '1Tim',  testament: 'New', chapters: 6,   order: 54 },
  { id: 55, name: '2 Timothy',        abbr: '2Tim',  testament: 'New', chapters: 4,   order: 55 },
  { id: 56, name: 'Titus',            abbr: 'Titus', testament: 'New', chapters: 3,   order: 56 },
  { id: 57, name: 'Philemon',         abbr: 'Phlm',  testament: 'New', chapters: 1,   order: 57 },
  { id: 58, name: 'Hebrews',          abbr: 'Heb',   testament: 'New', chapters: 13,  order: 58 },
  { id: 59, name: 'James',            abbr: 'Jas',   testament: 'New', chapters: 5,   order: 59 },
  { id: 60, name: '1 Peter',          abbr: '1Pet',  testament: 'New', chapters: 5,   order: 60 },
  { id: 61, name: '2 Peter',          abbr: '2Pet',  testament: 'New', chapters: 3,   order: 61 },
  { id: 62, name: '1 John',           abbr: '1Jn',   testament: 'New', chapters: 5,   order: 62 },
  { id: 63, name: '2 John',           abbr: '2Jn',   testament: 'New', chapters: 1,   order: 63 },
  { id: 64, name: '3 John',           abbr: '3Jn',   testament: 'New', chapters: 1,   order: 64 },
  { id: 65, name: 'Jude',             abbr: 'Jude',  testament: 'New', chapters: 1,   order: 65 },
  { id: 66, name: 'Revelation',       abbr: 'Rev',   testament: 'New', chapters: 22,  order: 66 },
]

// ---- Scrollmapper JSON format types ---------------------------

interface ScrollmapperVerse {
  verse: number
  text: string
}

interface ScrollmapperChapter {
  chapter: number
  verses: ScrollmapperVerse[]
}

interface ScrollmapperBook {
  name: string
  chapters: ScrollmapperChapter[]
}

interface ScrollmapperBible {
  translation: string
  books: ScrollmapperBook[]
}

// ---- Main seed ------------------------------------------------

async function seedBooks() {
  console.log('Seeding books...')
  const { error } = await supabase.from('books').upsert(
    BOOKS.map((b) => ({
      id: b.id,
      name: b.name,
      abbreviation: b.abbr,
      testament: b.testament,
      chapter_count: b.chapters,
      display_order: b.order,
    })),
    { onConflict: 'id' }
  )
  if (error) throw error
  console.log(`  ✓ ${BOOKS.length} books seeded`)
}

async function seedTranslation(code: 'WEB' | 'KJV') {
  console.log(`\nSeeding ${code}...`)

  // Get translation ID
  const { data: trans, error: tErr } = await supabase
    .from('translations')
    .select('id')
    .eq('code', code)
    .single()
  if (tErr || !trans) throw new Error(`Translation ${code} not found in DB — did you run schema.sql?`)
  const translationId = trans.id

  // Download
  console.log(`  Downloading ${code} from GitHub...`)
  const raw = await downloadJson(BIBLE_SOURCES[code]) as ScrollmapperBible
  const books = raw.books
  console.log(`  ✓ Downloaded ${books.length} books`)

  let totalVerses = 0

  for (let bookIdx = 0; bookIdx < Math.min(books.length, 66); bookIdx++) {
    const book = books[bookIdx]
    const bookId = bookIdx + 1
    const bookMeta = BOOKS[bookIdx]

    // Upsert chapters
    const chapterRows = book.chapters.map((ch) => ({
      book_id: bookId,
      chapter_number: ch.chapter,
      verse_count: ch.verses.length,
    }))
    const { error: chErr } = await supabase
      .from('chapters')
      .upsert(chapterRows, { onConflict: 'book_id,chapter_number' })
    if (chErr) throw chErr

    // Build verse rows
    const BATCH = 500
    const verseRows: Array<{
      book_id: number
      chapter_number: number
      verse_number: number
      text: string
      translation_id: number
    }> = []

    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        verseRows.push({
          book_id: bookId,
          chapter_number: ch.chapter,
          verse_number: v.verse,
          text: v.text,
          translation_id: translationId,
        })
      }
    }

    // Insert in batches
    for (let i = 0; i < verseRows.length; i += BATCH) {
      const batch = verseRows.slice(i, i + BATCH)
      const { error: vErr } = await supabase
        .from('verses')
        .upsert(batch, {
          onConflict: 'book_id,chapter_number,verse_number,translation_id',
        })
      if (vErr) throw vErr
    }

    totalVerses += verseRows.length
    process.stdout.write(`\r  ${code}: ${bookMeta.name} (${totalVerses} verses total)    `)
  }

  console.log(`\n  ✓ ${code}: ${totalVerses} verses seeded`)
}

async function main() {
  console.log('============================================')
  console.log('Bible Vibe — Bible Data Seed Script')
  console.log('============================================\n')

  await seedBooks()
  await seedTranslation('WEB')
  await seedTranslation('KJV')

  console.log('\n============================================')
  console.log('✓ Seed complete!')
  console.log('============================================')
  console.log('\nNext step: npm run dev')
}

main().catch((err) => {
  console.error('\nSeed failed:', err)
  process.exit(1)
})
