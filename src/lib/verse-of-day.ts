// Curated list of 60 well-known verses for the daily verse rotation
// Rotates daily based on day-of-year so it's deterministic (same for all users)

export const VOTD_VERSES = [
  { book_id: 43, chapter: 3, verse: 16 },   // John 3:16
  { book_id: 19, chapter: 23, verse: 1 },   // Psalm 23:1
  { book_id: 45, chapter: 8, verse: 28 },   // Romans 8:28
  { book_id: 49, chapter: 4, verse: 13 },   // Philippians 4:13
  { book_id: 24, chapter: 29, verse: 11 },  // Jeremiah 29:11
  { book_id: 23, chapter: 40, verse: 31 },  // Isaiah 40:31
  { book_id: 19, chapter: 46, verse: 1 },   // Psalm 46:1
  { book_id: 20, chapter: 3, verse: 5 },    // Proverbs 3:5
  { book_id: 40, chapter: 11, verse: 28 },  // Matthew 11:28
  { book_id: 43, chapter: 14, verse: 6 },   // John 14:6
  { book_id: 45, chapter: 12, verse: 2 },   // Romans 12:2
  { book_id: 49, chapter: 4, verse: 6 },    // Philippians 4:6
  { book_id: 1,  chapter: 1, verse: 1 },    // Genesis 1:1
  { book_id: 19, chapter: 119, verse: 105 }, // Psalm 119:105
  { book_id: 43, chapter: 1, verse: 1 },    // John 1:1
  { book_id: 23, chapter: 41, verse: 10 },  // Isaiah 41:10
  { book_id: 19, chapter: 91, verse: 1 },   // Psalm 91:1
  { book_id: 40, chapter: 6, verse: 33 },   // Matthew 6:33
  { book_id: 19, chapter: 27, verse: 1 },   // Psalm 27:1
  { book_id: 43, chapter: 8, verse: 32 },   // John 8:32
  { book_id: 58, chapter: 11, verse: 1 },   // Hebrews 11:1
  { book_id: 59, chapter: 1, verse: 5 },    // James 1:5
  { book_id: 62, chapter: 4, verse: 8 },    // 1 John 4:8
  { book_id: 45, chapter: 3, verse: 23 },   // Romans 3:23
  { book_id: 23, chapter: 53, verse: 5 },   // Isaiah 53:5
  { book_id: 19, chapter: 37, verse: 4 },   // Psalm 37:4
  { book_id: 20, chapter: 22, verse: 6 },   // Proverbs 22:6
  { book_id: 40, chapter: 5, verse: 16 },   // Matthew 5:16
  { book_id: 43, chapter: 10, verse: 10 },  // John 10:10
  { book_id: 49, chapter: 1, verse: 6 },    // Philippians 1:6
  { book_id: 19, chapter: 1, verse: 1 },    // Psalm 1:1
  { book_id: 48, chapter: 5, verse: 22 },   // Galatians 5:22
  { book_id: 49, chapter: 2, verse: 8 },    // Ephesians 2:8
  { book_id: 55, chapter: 1, verse: 7 },    // 2 Timothy 1:7
  { book_id: 19, chapter: 103, verse: 1 },  // Psalm 103:1
  { book_id: 20, chapter: 4, verse: 7 },    // Proverbs 4:7
  { book_id: 40, chapter: 28, verse: 19 },  // Matthew 28:19
  { book_id: 43, chapter: 15, verse: 5 },   // John 15:5
  { book_id: 45, chapter: 5, verse: 8 },    // Romans 5:8
  { book_id: 50, chapter: 4, verse: 7 },    // Philippians 4:7
  { book_id: 23, chapter: 9, verse: 6 },    // Isaiah 9:6
  { book_id: 19, chapter: 16, verse: 8 },   // Psalm 16:8
  { book_id: 57, chapter: 1, verse: 3 },    // Philemon 1:3
  { book_id: 46, chapter: 13, verse: 13 },  // 1 Corinthians 13:13
  { book_id: 19, chapter: 34, verse: 8 },   // Psalm 34:8
  { book_id: 20, chapter: 16, verse: 3 },   // Proverbs 16:3
  { book_id: 42, chapter: 1, verse: 37 },   // Luke 1:37
  { book_id: 43, chapter: 13, verse: 34 },  // John 13:34
  { book_id: 45, chapter: 1, verse: 16 },   // Romans 1:16
  { book_id: 19, chapter: 139, verse: 14 }, // Psalm 139:14
  { book_id: 23, chapter: 26, verse: 3 },   // Isaiah 26:3
  { book_id: 19, chapter: 62, verse: 1 },   // Psalm 62:1
  { book_id: 20, chapter: 31, verse: 25 },  // Proverbs 31:25
  { book_id: 42, chapter: 6, verse: 31 },   // Luke 6:31
  { book_id: 43, chapter: 11, verse: 25 },  // John 11:25
  { book_id: 45, chapter: 15, verse: 13 },  // Romans 15:13
  { book_id: 51, chapter: 3, verse: 23 },   // Colossians 3:23
  { book_id: 19, chapter: 84, verse: 11 },  // Psalm 84:11
  { book_id: 40, chapter: 7, verse: 7 },    // Matthew 7:7
  { book_id: 43, chapter: 16, verse: 33 },  // John 16:33
]

export function getVerseOfDay(): { book_id: number; chapter: number; verse: number } {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return VOTD_VERSES[dayOfYear % VOTD_VERSES.length]
}
