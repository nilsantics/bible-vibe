/**
 * Seed public-domain commentary library from SWORD modules.
 *
 * Sources (downloaded from CrossWire.org — all Public Domain):
 *   - Matthew Henry Complete (MHC)       — zCom4
 *   - Jamieson, Fausset & Brown (JFB)    — zCom4
 *   - Adam Clarke (Clarke)               — zCom
 *   - John Wesley Notes (Wesley)         — zCom
 *
 * Run: node scripts/seed-commentaries.mjs
 * Single source: node scripts/seed-commentaries.mjs MHC
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, createWriteStream } from 'fs'
import fs from 'fs'
import zlib from 'zlib'
import path from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SWORD_DIR = join(__dirname, 'cache', 'sword')
const BASE_URL  = 'https://crosswire.org/ftpmirror/pub/sword/packages/rawzip'

// ─── Commentary source definitions ────────────────────────────────────────────
const SOURCES = [
  {
    id:      'matthew-henry',
    label:   'Matthew Henry Complete Commentary',
    zipName: 'MHC.zip',
    dir:     'MHC',
    format:  'zcom4',
    dataPath: 'modules/comments/zcom4/mhc',
  },
  {
    id:      'jamieson-fausset-brown',
    label:   'Jamieson, Fausset & Brown Commentary',
    zipName: 'JFB.zip',
    dir:     'JFB',
    format:  'zcom4',
    dataPath: 'modules/comments/zcom/jfb',
  },
  {
    id:      'adam-clarke',
    label:   "Adam Clarke's Commentary",
    zipName: 'Clarke.zip',
    dir:     'Clarke',
    format:  'zcom',
    dataPath: 'modules/comments/zcom/clarke',
  },
  {
    id:      'john-wesley',
    label:   "John Wesley's Explanatory Notes",
    zipName: 'Wesley.zip',
    dir:     'Wesley',
    format:  'zcom',
    dataPath: 'modules/comments/zcom/wesley',
  },
]

// ─── KJV canonical book order → our book_id (1-based) ────────────────────────
// Block indices in SWORD OT files: 0 = empty header, 1 = Genesis ... 39 = Malachi
// Block indices in SWORD NT files: 0 = empty header, 1 = Matthew ... 27 = Revelation
const OT_BOOK_IDS = [
  0,   // block 0 = unused
  1,2,3,4,5,6,7,8,9,10,    // Gen–2 Chr (we use display_order from our table)
  11,12,13,14,15,16,17,18,19,20,
  21,22,23,24,25,26,27,28,29,30,
  31,32,33,34,35,36,37,38,39,
]
const NT_BOOK_IDS = [
  0,   // block 0 = unused
  40,41,42,43,44,45,46,47,48,49, // Matt–Col
  50,51,52,53,54,55,56,57,58,59, // 1Th–Phm
  60,61,62,63,64,65,66,           // Heb–Rev
]

// ─── SWORD parser ─────────────────────────────────────────────────────────────

function readBlocks_zcom4(bzsPath, bzzPath) {
  // zCom4: .bzs has 12 bytes per block [offset:u32, compSize:u32, decompSize:u32]
  const bzs = fs.readFileSync(bzsPath)
  const bzz = fs.readFileSync(bzzPath)
  const blocks = []
  for (let i = 0; i < bzs.length / 12; i++) {
    const offset   = bzs.readUInt32LE(i * 12)
    const compSize = bzs.readUInt32LE(i * 12 + 4)
    if (compSize === 0) { blocks.push(null); continue }
    const compressed = bzz.slice(offset, offset + compSize)
    try {
      blocks.push(zlib.inflateSync(compressed).toString('utf8'))
    } catch {
      blocks.push(null)
    }
  }
  return blocks
}

function readBlocks_zcom(bzsPath, bzzPath) {
  // zCom: .bzs has 8 bytes per block [offset:u32, compSize:u32]
  const bzs = fs.readFileSync(bzsPath)
  const bzz = fs.readFileSync(bzzPath)
  const blocks = []
  for (let i = 0; i < bzs.length / 8; i++) {
    const offset   = bzs.readUInt32LE(i * 8)
    const compSize = bzs.readUInt32LE(i * 8 + 4)
    if (compSize === 0) { blocks.push(null); continue }
    const compressed = bzz.slice(offset, offset + compSize)
    try {
      blocks.push(zlib.inflateSync(compressed).toString('utf8'))
    } catch {
      // Try raw inflate
      try { blocks.push(zlib.inflateRawSync(compressed).toString('utf8')) }
      catch { blocks.push(null) }
    }
  }
  return blocks
}

// Strip OSIS XML tags and clean up text
function stripOsis(text) {
  if (!text) return ''
  return text
    .replace(/<note[^>]*>[\s\S]*?<\/note>/gi, '')   // remove footnotes
    .replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, '$1\n')  // keep titles
    .replace(/<hi type="(bold|b|italic|i|small-caps)">([\s\S]*?)<\/hi>/gi, '$2')
    .replace(/<lb\/>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract chapter commentary from an OSIS block
// Returns: Map<chapterNum, string>
function extractChapters(blockText) {
  const chapters = new Map()
  if (!blockText) return chapters

  // Split by chapter markers
  const chapterPattern = /<chapter\s[^>]*osisID="[^."]+\.(\d+)"/g
  const positions = []
  let m
  while ((m = chapterPattern.exec(blockText)) !== null) {
    positions.push({ chNum: parseInt(m[1]), pos: m.index })
  }

  for (let i = 0; i < positions.length; i++) {
    const { chNum, pos } = positions[i]
    const end = i + 1 < positions.length ? positions[i + 1].pos : blockText.length
    const segment = blockText.slice(pos, end)
    const text = stripOsis(segment)
    if (text.length > 100) {
      chapters.set(chNum, text)
    }
  }

  // If no chapter markers found, treat entire block as chapter 1
  if (chapters.size === 0 && blockText.length > 200) {
    const text = stripOsis(blockText)
    if (text.length > 100) chapters.set(1, text)
  }

  return chapters
}

// ─── Download helper ──────────────────────────────────────────────────────────

async function ensureDownloaded(src) {
  const zipPath = join(SWORD_DIR, src.zipName)
  const extractDir = join(SWORD_DIR, src.dir)

  if (existsSync(join(extractDir, 'mods.d'))) {
    console.log(`  ${src.dir}: already extracted`)
    return true
  }

  if (!existsSync(zipPath)) {
    console.log(`  Downloading ${src.zipName}...`)
    const url = `${BASE_URL}/${src.zipName}`
    const res = await fetch(url)
    if (!res.ok) { console.error(`  ✗ HTTP ${res.status}`); return false }
    const buf = Buffer.from(await res.arrayBuffer())
    mkdirSync(SWORD_DIR, { recursive: true })
    fs.writeFileSync(zipPath, buf)
    console.log(`  Downloaded (${(buf.length/1024/1024).toFixed(1)} MB)`)
  }

  // Extract using unzip (available on most systems)
  const { execSync } = await import('child_process')
  try {
    execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: 'pipe' })
    console.log(`  Extracted to ${src.dir}/`)
    return true
  } catch {
    // Try with node unzipper if available
    console.error(`  ✗ Could not extract ${src.zipName}. Please run: unzip ${zipPath} -d ${extractDir}`)
    return false
  }
}

// ─── Embed + store ────────────────────────────────────────────────────────────

async function embedBatch(texts) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map(t => t.slice(0, 2000)),
  })
  return res.data.map(d => d.embedding)
}

async function storeChunks(chunks) {
  const BATCH = 40
  let done = 0
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    let embeddings
    try {
      embeddings = await embedBatch(batch.map(c => c.content))
    } catch (err) {
      console.error(`\n  ✗ Embedding failed: ${err.message}`)
      await sleep(5000)
      i -= BATCH
      continue
    }
    const rows = batch.map((c, j) => ({ ...c, embedding: JSON.stringify(embeddings[j]) }))
    const { error } = await supabase.from('commentary_chunks').insert(rows)
    if (error) console.error(`\n  ✗ DB error: ${error.message}`)
    else {
      done += batch.length
      process.stdout.write(`  ${done}/${chunks.length} chunks embedded\r`)
    }
    await sleep(800)
  }
  return done
}

// ─── Seed one source ──────────────────────────────────────────────────────────

async function seedSource(src) {
  console.log(`\n── ${src.label} (${src.id}) ──`)

  const ok = await ensureDownloaded(src)
  if (!ok) return

  const base = join(SWORD_DIR, src.dir, src.dataPath)
  if (!existsSync(base)) {
    // Try finding the data path by searching
    const found = fs.readdirSync(join(SWORD_DIR, src.dir), { recursive: true })
      .filter(f => f.endsWith('ot.bzz'))
    if (!found.length) { console.error('  ✗ Cannot find module data'); return }
    console.log('  Data found at', found[0])
  }

  // Check already-seeded count
  const { count: existing } = await supabase
    .from('commentary_chunks').select('id', { count: 'exact', head: true }).eq('source', src.id)
  console.log(`  ${existing ?? 0} chunks already seeded`)

  // Find actual data path
  let dataBase = base
  const otBzz = findFile(join(SWORD_DIR, src.dir), 'ot.bzz')
  const ntBzz = findFile(join(SWORD_DIR, src.dir), 'nt.bzz')
  if (!otBzz || !ntBzz) { console.error('  ✗ Cannot locate .bzz files'); return }
  dataBase = path.dirname(otBzz)

  const chunks = []

  for (const [testament, bzzFile, bzsFile, bzvFile, bookIds] of [
    ['OT', otBzz, otBzz.replace('ot.bzz','ot.bzs'), otBzz.replace('ot.bzz','ot.bzv'), OT_BOOK_IDS],
    ['NT', ntBzz, ntBzz.replace('nt.bzz','nt.bzs'), ntBzz.replace('nt.bzz','nt.bzv'), NT_BOOK_IDS],
  ]) {
    let blocks
    try {
      blocks = src.format === 'zcom4'
        ? readBlocks_zcom4(bzsFile, bzzFile)
        : readBlocks_zcom_auto(bzsFile, bzzFile)
    } catch (err) {
      console.error(`  ✗ Failed to read ${testament} blocks: ${err.message}`)
      continue
    }

    console.log(`  ${testament}: ${blocks.length} blocks`)

    for (let blockIdx = 1; blockIdx < blocks.length; blockIdx++) {
      const bookId = bookIds[blockIdx]
      if (!bookId) continue
      const block = blocks[blockIdx]
      if (!block) continue

      const chapMap = extractChapters(block)
      for (const [chNum, text] of chapMap) {
        if (text.length < 100) continue
        chunks.push({
          source:      src.id,
          book_id:     bookId,
          chapter:     chNum,
          verse_start: null,
          verse_end:   null,
          heading:     null,
          content:     text.slice(0, 4000),
        })
      }
    }
  }

  // Subtract already-seeded
  const { data: seededRows } = await supabase
    .from('commentary_chunks').select('book_id,chapter').eq('source', src.id)
  const seeded = new Set((seededRows ?? []).map(r => `${r.book_id}:${r.chapter}`))
  const todo = chunks.filter(c => !seeded.has(`${c.book_id}:${c.chapter}`))

  console.log(`  ${chunks.length} chapters parsed, ${todo.length} to embed`)

  if (todo.length === 0) { console.log('  Already fully seeded.'); return }

  const done = await storeChunks(todo)
  console.log(`\n  ✓ ${done} chunks stored for ${src.label}`)
}

// Detect zCom block size format empirically
function readBlocks_zcom_auto(bzsPath, bzzPath) {
  const bzs = fs.readFileSync(bzsPath)
  const bzz = fs.readFileSync(bzzPath)
  // Try 8-byte entries (offset + compSize)
  const blocks = []
  for (let i = 0; i < bzs.length / 8; i++) {
    const offset   = bzs.readUInt32LE(i * 8)
    const compSize = bzs.readUInt32LE(i * 8 + 4)
    if (compSize === 0 || offset + compSize > bzz.length) { blocks.push(null); continue }
    try {
      blocks.push(zlib.inflateSync(bzz.slice(offset, offset + compSize)).toString('utf8'))
    } catch {
      try {
        blocks.push(zlib.inflateRawSync(bzz.slice(offset, offset + compSize)).toString('utf8'))
      } catch {
        blocks.push(null)
      }
    }
  }
  return blocks
}

function findFile(dir, name) {
  if (!existsSync(dir)) return null
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      const found = findFile(p, name)
      if (found) return found
    } else if (e.name === name) return p
  }
  return null
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const filter = process.argv[2]?.toUpperCase()
  const targets = filter
    ? SOURCES.filter(s => s.dir.toUpperCase() === filter || s.id.includes(filter.toLowerCase()))
    : SOURCES

  if (targets.length === 0) {
    console.error(`Unknown source. Valid: ${SOURCES.map(s=>s.dir).join(', ')}`)
    process.exit(1)
  }

  console.log(`Seeding ${targets.length} commentary source(s)...\n`)
  mkdirSync(SWORD_DIR, { recursive: true })

  for (const src of targets) {
    await seedSource(src)
  }

  console.log('\n\nAll done.')
}

main().catch(console.error)
