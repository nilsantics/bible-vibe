/**
 * Bible Vibe — Verse Embedding Generation Script
 *
 * Generates OpenAI text-embedding-3-small embeddings for all WEB verses
 * and stores them in Supabase for semantic search.
 *
 * Run once: npx ts-node --project tsconfig.scripts.json scripts/generate-embeddings.ts
 *
 * Cost: ~$0.02 for the entire Bible (~31K verses × 20 tokens avg)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_KEY) {
  console.error('Missing required env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_KEY })

const EMBED_BATCH = 50     // verses per OpenAI embedding request
const INSERT_BATCH = 5     // rows per Supabase upsert (small = safe with HNSW index overhead)
const EMBED_MODEL = 'text-embedding-3-small'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log('============================================')
  console.log('Bible Vibe — Generate Verse Embeddings')
  console.log('============================================\n')

  // Get WEB translation ID
  const { data: trans } = await supabase
    .from('translations')
    .select('id')
    .eq('code', 'WEB')
    .single()
  if (!trans) throw new Error('WEB translation not found — run seed-bible.ts first')

  // Count total verses
  const { count: totalCount, error: countErr } = await supabase
    .from('verses')
    .select('*', { count: 'estimated', head: true })
    .eq('translation_id', trans.id)
  if (countErr) console.error('Count error:', countErr.message)
  const total = totalCount ?? 31104
  console.log(`Total WEB verses to embed: ${total}\n`)

  // Fetch verses in pages, upsert embeddings (idempotent via onConflict)
  // Skip fetching already-embedded IDs — upsert handles duplicates safely.
  let offset = 0
  let processed = 0
  const pageSize = 1000

  while (true) {
    const { data: verses, error } = await supabase
      .from('verses')
      .select('id, text')
      .eq('translation_id', trans.id)
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    if (!verses || verses.length === 0) break

    // Embed in large batches (OpenAI is fast), insert in smaller batches (Supabase HNSW index)
    for (let i = 0; i < verses.length; i += EMBED_BATCH) {
      const batch = verses.slice(i, i + EMBED_BATCH)
      const texts = batch.map((v) => v.text)

      let embeddings: number[][]
      try {
        const response = await openai.embeddings.create({ model: EMBED_MODEL, input: texts })
        embeddings = response.data.map((d) => d.embedding)
      } catch (err) {
        console.error('\nOpenAI embed error:', err)
        await sleep(3000)
        i -= EMBED_BATCH // retry
        continue
      }

      // Use JSON.stringify for embedding (matches pgvector wire format Supabase expects)
      // Insert with ignoreDuplicates (ON CONFLICT DO NOTHING) — much faster than upsert on HNSW
      const embeddingRows = batch.map((v: { id: number; text: string }, idx: number) => ({
        verse_id: v.id,
        embedding: JSON.stringify(embeddings[idx]),
      }))

      // Insert in smaller sub-batches to stay well within statement timeout
      for (let j = 0; j < embeddingRows.length; j += INSERT_BATCH) {
        const sub = embeddingRows.slice(j, j + INSERT_BATCH)
        let retries = 3
        while (retries-- > 0) {
          const { error: insErr } = await supabase
            .from('verse_embeddings')
            .upsert(sub, { onConflict: 'verse_id', ignoreDuplicates: true })
          if (!insErr) break
          console.error(`\n  DB error (${retries} retries left): ${insErr.message}`)
          await sleep(2000)
        }
        processed += sub.length
        process.stdout.write(`\rEmbedded: ${processed} / ${total}    `)
      }

      await sleep(50) // rate limit
    }

    offset += pageSize
    if (verses.length < pageSize) break
  }

  console.log(`\n\n✓ Done! ${processed} embeddings processed (upserted).`)
  console.log(`Total in DB: ${total}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
