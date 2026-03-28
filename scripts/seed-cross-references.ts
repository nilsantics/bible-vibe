/**
 * Bible Vibe — Cross Reference Seed Script
 *
 * Imports ~340,000 TSK cross-references from scrollmapper/bible_databases.
 * Run once after creating the cross_references table in Supabase.
 *
 * npx dotenv-cli -e .env.local -- npx ts-node --project tsconfig.scripts.json scripts/seed-cross-references.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BASE_URL =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/extras'
const FILES = [0, 1, 2, 3, 4, 5, 6].map((n) => `${BASE_URL}/cross_references_${n}.json`)

// Map English book names → book_id (1-indexed, matching our DB)
const BOOK_NAME_TO_ID: Record<string, number> = {
  Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5,
  Joshua: 6, Judges: 7, Ruth: 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  Ezra: 15, Nehemiah: 16, Esther: 17, Job: 18, Psalms: 19,
  Proverbs: 20, Ecclesiastes: 21, 'Song of Solomon': 22, Isaiah: 23,
  Jeremiah: 24, Lamentations: 25, Ezekiel: 26, Daniel: 27, Hosea: 28,
  Joel: 29, Amos: 30, Obadiah: 31, Jonah: 32, Micah: 33, Nahum: 34,
  Habakkuk: 35, Zephaniah: 36, Haggai: 37, Zechariah: 38, Malachi: 39,
  Matthew: 40, Mark: 41, Luke: 42, John: 43, Acts: 44,
  Romans: 45, '1 Corinthians': 46, '2 Corinthians': 47, Galatians: 48,
  Ephesians: 49, Philippians: 50, Colossians: 51,
  '1 Thessalonians': 52, '2 Thessalonians': 53,
  '1 Timothy': 54, '2 Timothy': 55, Titus: 56, Philemon: 57,
  Hebrews: 58, James: 59, '1 Peter': 60, '2 Peter': 61,
  '1 John': 62, '2 John': 63, '3 John': 64, Jude: 65, Revelation: 66,
  // Aliases
  'Song of Songs': 22, 'Psalm': 19, 'Revelation of John': 66,
}

interface XRefEntry {
  from_verse: { book: string; chapter: number; verse: number }
  to_verse: { book: string; chapter: number; verse_start: number; verse_end: number }[]
  votes: number
}

interface XRefFile {
  cross_references: XRefEntry[]
}

const BATCH_SIZE = 500

async function main() {
  console.log('============================================')
  console.log('Bible Vibe — Seed Cross References')
  console.log('============================================\n')

  // Check existing count
  const { count: existing } = await supabase
    .from('cross_references')
    .select('*', { count: 'exact', head: true })
  console.log(`Already in DB: ${existing ?? 0} cross-references\n`)

  let totalInserted = 0
  let totalSkipped = 0

  for (const url of FILES) {
    const fileNum = url.match(/(\d)\.json$/)?.[1]
    console.log(`Fetching file ${fileNum}...`)

    const res = await fetch(url)
    if (!res.ok) { console.warn(`  Failed: ${res.status}`); continue }

    const data: XRefFile = await res.json()
    const rows: {
      from_book_id: number; from_chapter: number; from_verse: number
      to_book_id: number;   to_chapter: number;   to_verse: number
    }[] = []

    for (const entry of data.cross_references) {
      const fromId = BOOK_NAME_TO_ID[entry.from_verse.book]
      if (!fromId) { totalSkipped++; continue }

      for (const to of entry.to_verse) {
        const toId = BOOK_NAME_TO_ID[to.book]
        if (!toId) { totalSkipped++; continue }

        rows.push({
          from_book_id: fromId,
          from_chapter: entry.from_verse.chapter,
          from_verse: entry.from_verse.verse,
          to_book_id: toId,
          to_chapter: to.chapter,
          to_verse: to.verse_start,
        })
      }
    }

    console.log(`  ${rows.length} rows to insert...`)

    // Batch insert
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('cross_references').insert(batch)
      if (error) {
        console.error(`  Insert error: ${error.message}`)
      } else {
        totalInserted += batch.length
        process.stdout.write(`\r  Inserted ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`)
      }
    }
    console.log()
  }

  console.log(`\n✅ Done! Inserted ${totalInserted} cross-references (${totalSkipped} skipped)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
