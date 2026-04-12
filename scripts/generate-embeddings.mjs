/**
 * Generate verse embeddings — plain ESM, no TypeScript compilation needed.
 * Run: node scripts/generate-embeddings.mjs
 */
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const EMBED_BATCH = 50   // verses per OpenAI call
const INSERT_BATCH = 5   // rows per Supabase insert (HNSW-safe)
const PAGE_SIZE = 500    // verses per DB fetch page
const SLEEP_MS = 100     // ms between OpenAI calls

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log('============================================')
  console.log('Bible Vibe — Generate Verse Embeddings')
  console.log('============================================\n')

  // WEB translation ID
  const { data: trans } = await supabase.from('translations').select('id').eq('code', 'WEB').single()
  if (!trans) throw new Error('WEB translation not found')
  console.log('WEB translation id:', trans.id)

  let offset = 0
  let processed = 0
  let skipped = 0

  while (true) {
    const { data: verses, error } = await supabase
      .from('verses')
      .select('id, text')
      .eq('translation_id', trans.id)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) { console.error('Verse fetch error:', error.message); break }
    if (!verses || verses.length === 0) break

    // Embed in EMBED_BATCH chunks
    for (let i = 0; i < verses.length; i += EMBED_BATCH) {
      const batch = verses.slice(i, i + EMBED_BATCH).filter(v => v.text && v.text.trim())
      if (batch.length === 0) continue
      const texts = batch.map(v => v.text)

      let embeddings
      try {
        const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts })
        embeddings = res.data.map(d => d.embedding)
      } catch (err) {
        console.error('\nOpenAI error:', err.message)
        await sleep(3000)
        i -= EMBED_BATCH
        continue
      }

      const rows = batch.map((v, j) => ({ verse_id: v.id, embedding: JSON.stringify(embeddings[j]) }))

      // Insert in tiny sub-batches (HNSW index update is expensive)
      for (let j = 0; j < rows.length; j += INSERT_BATCH) {
        const sub = rows.slice(j, j + INSERT_BATCH)
        let ok = false
        for (let retry = 3; retry > 0 && !ok; retry--) {
          const { error: insErr } = await supabase
            .from('verse_embeddings')
            .upsert(sub, { onConflict: 'verse_id', ignoreDuplicates: true })
          if (!insErr) { ok = true }
          else {
            console.error(`\n  Insert error (${retry - 1} retries): ${insErr.message}`)
            await sleep(2000)
          }
        }
        if (ok) processed += sub.length
        else skipped += sub.length
        process.stdout.write(`\r  Processed: ${processed} | Skipped: ${skipped}    `)
      }

      await sleep(SLEEP_MS)
    }

    offset += PAGE_SIZE
    if (verses.length < PAGE_SIZE) break
  }

  console.log(`\n\n✓ Done! processed=${processed}, skipped=${skipped}`)
}

main().catch(err => { console.error('Failed:', err); process.exit(1) })
