/**
 * Seed Matthew Henry Concise Commentary into commentary_chunks with OpenAI embeddings.
 *
 * Source: scrollmapper/bible_databases (public domain)
 * Run once: node scripts/seed-commentaries.mjs
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * The source JSON format is:
 *   [ { "b": <book_number>, "c": <chapter>, "v": <verse_or_0>, "t": "<commentary_text>" }, ... ]
 * where b uses the standard Bible book numbering (1=Genesis ... 66=Revelation)
 * and v=0 means the entry covers the entire chapter.
 *
 * We embed each chunk individually and upsert into commentary_chunks.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Source ───────────────────────────────────────────────────────────────────
// Matthew Henry Concise Commentary JSON from scrollmapper/bible_databases
const SOURCE_URL =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/json/t_matt_henry_con.json'
const LOCAL_CACHE = join(__dirname, 'cache', 'matthew_henry.json')

// ─── Book mapping (scrollmapper 1-based = standard Bible order) ───────────────
// Books 1–39 = OT, 40–66 = NT
// We store book_id matching our `books` table display_order (also 1-based)

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchSource() {
  if (existsSync(LOCAL_CACHE)) {
    console.log(`Using cached file at ${LOCAL_CACHE}`)
    return JSON.parse(readFileSync(LOCAL_CACHE, 'utf8'))
  }
  console.log(`Downloading Matthew Henry Concise from GitHub...`)
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data = await res.json()
  // Cache it
  const { mkdirSync, writeFileSync } = await import('fs')
  mkdirSync(join(__dirname, 'cache'), { recursive: true })
  writeFileSync(LOCAL_CACHE, JSON.stringify(data), 'utf8')
  console.log(`Cached to ${LOCAL_CACHE}`)
  return data
}

async function embedBatch(texts) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return res.data.map((d) => d.embedding)
}

// Strip HTML tags that sometimes appear in the source
function stripHtml(text) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const raw = await fetchSource()

  if (!Array.isArray(raw)) throw new Error('Unexpected JSON shape — expected an array')
  console.log(`Loaded ${raw.length} entries from Matthew Henry Concise`)

  // Filter to entries with meaningful text (skip stubs < 80 chars)
  const entries = raw
    .filter((e) => e.t && e.t.trim().length > 80)
    .map((e) => ({
      source:      'matthew-henry',
      book_id:     e.b,
      chapter:     e.c,
      verse_start: e.v === 0 ? null : e.v,
      verse_end:   e.v === 0 ? null : e.v,
      heading:     null,
      content:     stripHtml(e.t),
    }))

  console.log(`${entries.length} entries after filtering`)

  // Check how many are already seeded
  const { count: existing } = await supabase
    .from('commentary_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'matthew-henry')

  console.log(`${existing ?? 0} Matthew Henry chunks already in DB`)

  if ((existing ?? 0) >= entries.length) {
    console.log('Already fully seeded. Use --force to re-seed.')
    return
  }

  // Get existing (book_id, chapter, verse_start) combos to skip
  const { data: seededRows } = await supabase
    .from('commentary_chunks')
    .select('book_id, chapter, verse_start')
    .eq('source', 'matthew-henry')

  const seededSet = new Set(
    (seededRows ?? []).map((r) => `${r.book_id}:${r.chapter}:${r.verse_start ?? 'null'}`),
  )

  const todo = entries.filter(
    (e) => !seededSet.has(`${e.book_id}:${e.chapter}:${e.verse_start ?? 'null'}`),
  )

  console.log(`${todo.length} entries to seed\n`)

  const BATCH = 50   // OpenAI embedding batch size
  let done = 0

  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH)
    const texts = batch.map((e) => e.content.slice(0, 2000)) // truncate for embedding

    let embeddings
    try {
      embeddings = await embedBatch(texts)
    } catch (err) {
      console.error(`  Embedding batch failed: ${err.message}`)
      await sleep(3000)
      continue
    }

    const rows = batch.map((e, j) => ({
      ...e,
      embedding: JSON.stringify(embeddings[j]),
    }))

    const { error } = await supabase.from('commentary_chunks').insert(rows)
    if (error) {
      console.error(`  DB insert failed: ${error.message}`)
    } else {
      done += batch.length
      process.stdout.write(
        `  Seeded ${done}/${todo.length} (book ${batch[0].book_id} ch ${batch[0].chapter})\r`,
      )
    }

    // Rate-limit: ~100 req/min for OpenAI embeddings on free tier
    await sleep(700)
  }

  console.log(`\n\nDone! ${done} Matthew Henry chunks embedded and stored.`)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

main().catch(console.error)
