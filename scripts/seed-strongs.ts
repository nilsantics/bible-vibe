/**
 * Bible Vibe — Strong's Concordance Seed Script
 *
 * Imports ~8,700 Hebrew (OT) and ~5,600 Greek (NT) entries
 * from Open Scriptures (CC-BY-SA).
 *
 * npx dotenv-cli -e .env.local -- npx ts-node --project tsconfig.scripts.json scripts/seed-strongs.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const HEB_URL =
  'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js'
const GRK_URL =
  'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js'

interface HebEntry {
  lemma: string
  xlit: string
  pron: string
  derivation: string
  strongs_def: string
  kjv_def: string
}

interface GrkEntry {
  lemma: string
  translit: string
  pron?: string
  derivation: string
  strongs_def: string
  kjv_def: string
}

function stripJsWrapper(js: string): string {
  // Extract just the JSON object: from first `{` to last `}`
  const first = js.indexOf('{')
  const last = js.lastIndexOf('}')
  if (first === -1 || last === -1) throw new Error('No JSON object found')
  return js.slice(first, last + 1)
}

const BATCH_SIZE = 500

async function seedTestament(
  url: string,
  testament: 'OT' | 'NT',
  prefix: string
) {
  console.log(`\nFetching ${testament} (${prefix} prefix)...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const js = await res.text()
  const json = stripJsWrapper(js)
  const dict: Record<string, HebEntry | GrkEntry> = JSON.parse(json)

  const rows = Object.entries(dict).map(([number, entry]) => {
    if (prefix === 'H') {
      const e = entry as HebEntry
      return {
        number,
        word: e.lemma ?? '',
        transliteration: e.xlit ?? null,
        pronunciation: e.pron ?? null,
        definition: e.strongs_def ?? '',
        derivation: e.derivation ?? null,
        kjv_usage: e.kjv_def ?? null,
        testament,
      }
    } else {
      const e = entry as GrkEntry
      return {
        number,
        word: e.lemma ?? '',
        transliteration: e.translit ?? null,
        pronunciation: (e as any).pron ?? null,
        definition: e.strongs_def ?? '',
        derivation: e.derivation ?? null,
        kjv_usage: e.kjv_def ?? null,
        testament,
      }
    }
  })

  console.log(`  ${rows.length} entries found`)

  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('strongs_entries')
      .upsert(batch, { onConflict: 'number' })
    if (error) {
      console.error(`  Error: ${error.message}`)
    } else {
      inserted += batch.length
      process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length} inserted`)
    }
  }
  console.log()
  return inserted
}

async function main() {
  console.log('============================================')
  console.log("Bible Vibe — Seed Strong's Concordance")
  console.log('============================================')

  const heb = await seedTestament(HEB_URL, 'OT', 'H')
  const grk = await seedTestament(GRK_URL, 'NT', 'G')

  console.log(`\n✅ Done! Hebrew: ${heb} entries, Greek: ${grk} entries`)
}

main().catch((e) => { console.error(e); process.exit(1) })
