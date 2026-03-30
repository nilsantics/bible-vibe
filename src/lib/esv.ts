export interface VerseRow {
  id: number
  book_id: number
  chapter_number: number
  verse_number: number
  text: string
}

export async function fetchESVChapter(
  bookName: string,
  chapter: number,
  bookId: number
): Promise<VerseRow[]> {
  const apiKey = process.env.ESV_API_KEY
  if (!apiKey) throw new Error('ESV_API_KEY is not set')

  const url = new URL('https://api.esv.org/v3/passage/text/')
  url.searchParams.set('q', `${bookName} ${chapter}`)
  url.searchParams.set('include-headings', 'false')
  url.searchParams.set('include-footnotes', 'false')
  url.searchParams.set('include-verse-numbers', 'true')
  url.searchParams.set('include-short-copyright', 'false')
  url.searchParams.set('include-passage-references', 'false')
  url.searchParams.set('indent-paragraphs', '0')
  url.searchParams.set('indent-poetry', 'false')
  url.searchParams.set('indent-declares', '0')
  url.searchParams.set('indent-psalm-doxology', 'false')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 86400 }, // cache 24h — ESV quota is 5k/day
  })

  if (!res.ok) throw new Error(`ESV API error: ${res.status}`)

  const data = await res.json()
  const raw: string = data.passages?.[0] ?? ''

  // The ESV API embeds verse numbers as [N] markers in the text.
  // Split on them to produce individual verse objects.
  const verses: VerseRow[] = []
  const parts = raw.split(/\[(\d+)\]/)

  for (let i = 1; i < parts.length; i += 2) {
    const verseNum = parseInt(parts[i], 10)
    const text = parts[i + 1]?.trim().replace(/\s+/g, ' ') ?? ''
    if (text) {
      verses.push({
        // Use a synthetic negative ID so ESV verses never collide with DB rows.
        // Highlights/notes won't persist for ESV (acceptable — ESV is read-only here).
        id: -(bookId * 100000 + chapter * 1000 + verseNum),
        book_id: bookId,
        chapter_number: chapter,
        verse_number: verseNum,
        text,
      })
    }
  }

  return verses
}
