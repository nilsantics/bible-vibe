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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_KEY) {
  console.error('Missing required env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_KEY })

const BATCH_SIZE = 100      // verses per embedding request
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
  const { count } = await supabase
    .from('verses')
    .select('*', { count: 'exact', head: true })
    .eq('translation_id', trans.id)
  console.log(`Total WEB verses to embed: ${count}\n`)

  // Find verses that don't have embeddings yet
  const { data: alreadyEmbedded } = await supabase
    .from('verse_embeddings')
    .select('verse_id')
  const embeddedIds = new Set((alreadyEmbedded ?? []).map((e) => e.verse_id))
  console.log(`Already embedded: ${embeddedIds.size}`)

  // Fetch all verses in batches
  let offset = 0
  let processed = 0
  const pageSize = 1000

  while (true) {
    const { data: verses, error } = await supabase
      .from('verses')
      .select('id, text, book_id, chapter_number, verse_number')
      .eq('translation_id', trans.id)
      .range(offset, offset + pageSize - 1)
      .order('book_id')
      .order('chapter_number')
      .order('verse_number')

    if (error) throw error
    if (!verses || verses.length === 0) break

    const toEmbed = verses.filter((v) => !embeddedIds.has(v.id))

    // Process in batches
    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE)
      const texts = batch.map((v) => v.text)

      try {
        const response = await openai.embeddings.create({
          model: EMBED_MODEL,
          input: texts,
        })

        const embeddingRows = batch.map((v, idx) => ({
          verse_id: v.id,
          embedding: response.data[idx].embedding,
        }))

        const { error: insErr } = await supabase
          .from('verse_embeddings')
          .upsert(embeddingRows, { onConflict: 'verse_id' })
        if (insErr) throw insErr

        processed += batch.length
        process.stdout.write(
          `\rEmbedded: ${processed + embeddedIds.size} / ${count}    `
        )

        // Rate limit: ~3000 requests/min, be conservative
        await sleep(50)
      } catch (err) {
        console.error('\nEmbedding error:', err)
        await sleep(2000) // back off on error
      }
    }

    offset += pageSize
    if (verses.length < pageSize) break
  }

  console.log(`\n\n✓ Done! ${processed} new embeddings generated.`)
  console.log(`Total embeddings in DB: ${processed + embeddedIds.size}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
