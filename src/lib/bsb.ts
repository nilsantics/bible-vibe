import type { VerseRow } from './esv'

// Berean Standard Bible — served free via bolls.life
// GET https://bolls.life/get-chapter/BSB/{book_id}/{chapter}/
// Returns: [{ pk, verse, text }, ...]
// book_id is standard 1-based Bible book order (matches our DB book IDs)

export async function fetchBSBChapter(
  bookId: number,
  chapter: number
): Promise<VerseRow[]> {
  const res = await fetch(
    `https://bolls.life/get-chapter/BSB/${bookId}/${chapter}/`,
    { next: { revalidate: 86400 } } // cache 24h
  )

  if (!res.ok) throw new Error(`BSB API error: ${res.status}`)

  const data: { pk: number; verse: number; text: string }[] = await res.json()

  return data.map((v) => ({
    id: -(bookId * 100000 + chapter * 1000 + v.verse), // synthetic negative ID (same pattern as ESV)
    book_id: bookId,
    chapter_number: chapter,
    verse_number: v.verse,
    text: v.text,
  }))
}
