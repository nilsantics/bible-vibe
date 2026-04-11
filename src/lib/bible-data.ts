// Static Bible metadata — 66 books, testament info, chapter counts
// This is used for navigation and display; actual verse text lives in Supabase.

export const BIBLE_BOOKS = [
  // Old Testament
  { id: 1,  name: 'Genesis',        abbr: 'Gen',  testament: 'Old', chapters: 50,  order: 1 },
  { id: 2,  name: 'Exodus',         abbr: 'Exod', testament: 'Old', chapters: 40,  order: 2 },
  { id: 3,  name: 'Leviticus',      abbr: 'Lev',  testament: 'Old', chapters: 27,  order: 3 },
  { id: 4,  name: 'Numbers',        abbr: 'Num',  testament: 'Old', chapters: 36,  order: 4 },
  { id: 5,  name: 'Deuteronomy',    abbr: 'Deut', testament: 'Old', chapters: 34,  order: 5 },
  { id: 6,  name: 'Joshua',         abbr: 'Josh', testament: 'Old', chapters: 24,  order: 6 },
  { id: 7,  name: 'Judges',         abbr: 'Judg', testament: 'Old', chapters: 21,  order: 7 },
  { id: 8,  name: 'Ruth',           abbr: 'Ruth', testament: 'Old', chapters: 4,   order: 8 },
  { id: 9,  name: '1 Samuel',       abbr: '1Sam', testament: 'Old', chapters: 31,  order: 9 },
  { id: 10, name: '2 Samuel',       abbr: '2Sam', testament: 'Old', chapters: 24,  order: 10 },
  { id: 11, name: '1 Kings',        abbr: '1Kgs', testament: 'Old', chapters: 22,  order: 11 },
  { id: 12, name: '2 Kings',        abbr: '2Kgs', testament: 'Old', chapters: 25,  order: 12 },
  { id: 13, name: '1 Chronicles',   abbr: '1Chr', testament: 'Old', chapters: 29,  order: 13 },
  { id: 14, name: '2 Chronicles',   abbr: '2Chr', testament: 'Old', chapters: 36,  order: 14 },
  { id: 15, name: 'Ezra',           abbr: 'Ezra', testament: 'Old', chapters: 10,  order: 15 },
  { id: 16, name: 'Nehemiah',       abbr: 'Neh',  testament: 'Old', chapters: 13,  order: 16 },
  { id: 17, name: 'Esther',         abbr: 'Esth', testament: 'Old', chapters: 10,  order: 17 },
  { id: 18, name: 'Job',            abbr: 'Job',  testament: 'Old', chapters: 42,  order: 18 },
  { id: 19, name: 'Psalms',         abbr: 'Ps',   testament: 'Old', chapters: 150, order: 19 },
  { id: 20, name: 'Proverbs',       abbr: 'Prov', testament: 'Old', chapters: 31,  order: 20 },
  { id: 21, name: 'Ecclesiastes',   abbr: 'Eccl', testament: 'Old', chapters: 12,  order: 21 },
  { id: 22, name: 'Song of Songs',  abbr: 'Song', testament: 'Old', chapters: 8,   order: 22 },
  { id: 23, name: 'Isaiah',         abbr: 'Isa',  testament: 'Old', chapters: 66,  order: 23 },
  { id: 24, name: 'Jeremiah',       abbr: 'Jer',  testament: 'Old', chapters: 52,  order: 24 },
  { id: 25, name: 'Lamentations',   abbr: 'Lam',  testament: 'Old', chapters: 5,   order: 25 },
  { id: 26, name: 'Ezekiel',        abbr: 'Ezek', testament: 'Old', chapters: 48,  order: 26 },
  { id: 27, name: 'Daniel',         abbr: 'Dan',  testament: 'Old', chapters: 12,  order: 27 },
  { id: 28, name: 'Hosea',          abbr: 'Hos',  testament: 'Old', chapters: 14,  order: 28 },
  { id: 29, name: 'Joel',           abbr: 'Joel', testament: 'Old', chapters: 3,   order: 29 },
  { id: 30, name: 'Amos',           abbr: 'Amos', testament: 'Old', chapters: 9,   order: 30 },
  { id: 31, name: 'Obadiah',        abbr: 'Obad', testament: 'Old', chapters: 1,   order: 31 },
  { id: 32, name: 'Jonah',          abbr: 'Jonah',testament: 'Old', chapters: 4,   order: 32 },
  { id: 33, name: 'Micah',          abbr: 'Mic',  testament: 'Old', chapters: 7,   order: 33 },
  { id: 34, name: 'Nahum',          abbr: 'Nah',  testament: 'Old', chapters: 3,   order: 34 },
  { id: 35, name: 'Habakkuk',       abbr: 'Hab',  testament: 'Old', chapters: 3,   order: 35 },
  { id: 36, name: 'Zephaniah',      abbr: 'Zeph', testament: 'Old', chapters: 3,   order: 36 },
  { id: 37, name: 'Haggai',         abbr: 'Hag',  testament: 'Old', chapters: 2,   order: 37 },
  { id: 38, name: 'Zechariah',      abbr: 'Zech', testament: 'Old', chapters: 14,  order: 38 },
  { id: 39, name: 'Malachi',        abbr: 'Mal',  testament: 'Old', chapters: 4,   order: 39 },
  // New Testament
  { id: 40, name: 'Matthew',        abbr: 'Matt', testament: 'New', chapters: 28,  order: 40 },
  { id: 41, name: 'Mark',           abbr: 'Mark', testament: 'New', chapters: 16,  order: 41 },
  { id: 42, name: 'Luke',           abbr: 'Luke', testament: 'New', chapters: 24,  order: 42 },
  { id: 43, name: 'John',           abbr: 'John', testament: 'New', chapters: 21,  order: 43 },
  { id: 44, name: 'Acts',           abbr: 'Acts', testament: 'New', chapters: 28,  order: 44 },
  { id: 45, name: 'Romans',         abbr: 'Rom',  testament: 'New', chapters: 16,  order: 45 },
  { id: 46, name: '1 Corinthians',  abbr: '1Cor', testament: 'New', chapters: 16,  order: 46 },
  { id: 47, name: '2 Corinthians',  abbr: '2Cor', testament: 'New', chapters: 13,  order: 47 },
  { id: 48, name: 'Galatians',      abbr: 'Gal',  testament: 'New', chapters: 6,   order: 48 },
  { id: 49, name: 'Ephesians',      abbr: 'Eph',  testament: 'New', chapters: 6,   order: 49 },
  { id: 50, name: 'Philippians',    abbr: 'Phil', testament: 'New', chapters: 4,   order: 50 },
  { id: 51, name: 'Colossians',     abbr: 'Col',  testament: 'New', chapters: 4,   order: 51 },
  { id: 52, name: '1 Thessalonians',abbr: '1Th',  testament: 'New', chapters: 5,   order: 52 },
  { id: 53, name: '2 Thessalonians',abbr: '2Th',  testament: 'New', chapters: 3,   order: 53 },
  { id: 54, name: '1 Timothy',      abbr: '1Tim', testament: 'New', chapters: 6,   order: 54 },
  { id: 55, name: '2 Timothy',      abbr: '2Tim', testament: 'New', chapters: 4,   order: 55 },
  { id: 56, name: 'Titus',          abbr: 'Titus',testament: 'New', chapters: 3,   order: 56 },
  { id: 57, name: 'Philemon',       abbr: 'Phlm', testament: 'New', chapters: 1,   order: 57 },
  { id: 58, name: 'Hebrews',        abbr: 'Heb',  testament: 'New', chapters: 13,  order: 58 },
  { id: 59, name: 'James',          abbr: 'Jas',  testament: 'New', chapters: 5,   order: 59 },
  { id: 60, name: '1 Peter',        abbr: '1Pet', testament: 'New', chapters: 5,   order: 60 },
  { id: 61, name: '2 Peter',        abbr: '2Pet', testament: 'New', chapters: 3,   order: 61 },
  { id: 62, name: '1 John',         abbr: '1Jn',  testament: 'New', chapters: 5,   order: 62 },
  { id: 63, name: '2 John',         abbr: '2Jn',  testament: 'New', chapters: 1,   order: 63 },
  { id: 64, name: '3 John',         abbr: '3Jn',  testament: 'New', chapters: 1,   order: 64 },
  { id: 65, name: 'Jude',           abbr: 'Jude', testament: 'New', chapters: 1,   order: 65 },
  { id: 66, name: 'Revelation',     abbr: 'Rev',  testament: 'New', chapters: 22,  order: 66 },
] as const

export type BookName = (typeof BIBLE_BOOKS)[number]['name']

// Deuterocanonical / Apocryphal books — metadata only
// Verse text for these is not loaded in the main DB; they link to external resources
export const APOC_BOOKS = [
  { id: 70,  name: 'Tobit',                    abbr: 'Tob',   tradition: 'Catholic/Orthodox', chapters: 14,  externalUrl: 'https://www.biblegateway.com/passage/?search=Tobit+1&version=NABRE' },
  { id: 71,  name: 'Judith',                   abbr: 'Jdt',   tradition: 'Catholic/Orthodox', chapters: 16,  externalUrl: 'https://www.biblegateway.com/passage/?search=Judith+1&version=NABRE' },
  { id: 72,  name: 'Wisdom of Solomon',         abbr: 'Wis',   tradition: 'Catholic/Orthodox', chapters: 19,  externalUrl: 'https://www.biblegateway.com/passage/?search=Wisdom+1&version=NABRE' },
  { id: 73,  name: 'Sirach',                   abbr: 'Sir',   tradition: 'Catholic/Orthodox', chapters: 51,  externalUrl: 'https://www.biblegateway.com/passage/?search=Sirach+1&version=NABRE' },
  { id: 74,  name: 'Baruch',                   abbr: 'Bar',   tradition: 'Catholic/Orthodox', chapters: 6,   externalUrl: 'https://www.biblegateway.com/passage/?search=Baruch+1&version=NABRE' },
  { id: 75,  name: '1 Maccabees',              abbr: '1Mac',  tradition: 'Catholic/Orthodox', chapters: 16,  externalUrl: 'https://www.biblegateway.com/passage/?search=1+Maccabees+1&version=NABRE' },
  { id: 76,  name: '2 Maccabees',              abbr: '2Mac',  tradition: 'Catholic/Orthodox', chapters: 15,  externalUrl: 'https://www.biblegateway.com/passage/?search=2+Maccabees+1&version=NABRE' },
  { id: 77,  name: '1 Esdras',                 abbr: '1Esd',  tradition: 'Orthodox',          chapters: 9,   externalUrl: 'https://ccel.org/bible/nasb/nasb.1Esd.1.html' },
  { id: 78,  name: '3 Maccabees',              abbr: '3Mac',  tradition: 'Orthodox',          chapters: 7,   externalUrl: 'https://ccel.org/bible/nasb/nasb.3Mac.1.html' },
  { id: 79,  name: 'Prayer of Manasseh',       abbr: 'PrMan', tradition: 'Orthodox',          chapters: 1,   externalUrl: 'https://ccel.org/bible/nasb/nasb.PrMan.1.html' },
] as const

export const APOC_CATEGORIES = [
  { label: 'Catholic Deuterocanon', ids: [70, 71, 72, 73, 74, 75, 76] },
  { label: 'Orthodox Additions',    ids: [77, 78, 79] },
] as const

// Book category groupings for the sidebar
export const OT_CATEGORIES = [
  { label: 'Pentateuch',      ids: [1, 2, 3, 4, 5] },
  { label: 'Historical',      ids: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
  { label: 'Wisdom & Poetry', ids: [18, 19, 20, 21, 22] },
  { label: 'Major Prophets',  ids: [23, 24, 25, 26, 27] },
  { label: 'Minor Prophets',  ids: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39] },
] as const

export const NT_CATEGORIES = [
  { label: 'Gospels',         ids: [40, 41, 42, 43] },
  { label: 'Acts',            ids: [44] },
  { label: "Paul's Letters",  ids: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57] },
  { label: 'General Letters', ids: [58, 59, 60, 61, 62, 63, 64, 65] },
  { label: 'Prophecy',        ids: [66] },
] as const

export function getBookById(id: number) {
  return BIBLE_BOOKS.find((b) => b.id === id)
}

export function getBookByName(name: string) {
  const normalized = name.toLowerCase().replace(/-/g, ' ')
  return BIBLE_BOOKS.find(
    (b) =>
      b.name.toLowerCase() === normalized ||
      b.abbr.toLowerCase() === normalized ||
      b.name.toLowerCase().replace(/\s+/g, '-') === name.toLowerCase() ||
      b.name.toLowerCase().replace(/\s+/g, '') === normalized.replace(/\s+/g, '')
  )
}

export const OT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === 'Old')
export const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === 'New')

// Format a Bible reference for display
export function formatReference(
  bookName: string,
  chapter: number,
  verse?: number
): string {
  if (verse) return `${bookName} ${chapter}:${verse}`
  return `${bookName} ${chapter}`
}
