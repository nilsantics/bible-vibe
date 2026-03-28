import { BIBLE_BOOKS } from './bible-data'

export interface PlanTemplate {
  id: string
  name: string
  description: string
  durationDays: number
  icon: string
  chaptersPerDay: number
  books?: number[] // book_ids, undefined = whole Bible
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'bible-in-a-year',
    name: 'Bible in a Year',
    description: 'Read through the entire Bible in 365 days — roughly 3–4 chapters per day.',
    durationDays: 365,
    icon: '📖',
    chaptersPerDay: 3,
  },
  {
    id: 'nt-in-90-days',
    name: 'New Testament in 90 Days',
    description: 'Cover all 27 NT books in 90 days. About 3 chapters per day.',
    durationDays: 90,
    icon: '✝️',
    chaptersPerDay: 3,
    books: Array.from({ length: 27 }, (_, i) => i + 40), // books 40–66
  },
  {
    id: 'psalms-proverbs',
    name: 'Psalms & Proverbs in 60 Days',
    description: 'A month of wisdom literature — 3 Psalms and half a Proverbs chapter each day.',
    durationDays: 60,
    icon: '🎵',
    chaptersPerDay: 3,
    books: [19, 20], // Psalms + Proverbs
  },
  {
    id: 'gospels',
    name: 'The Four Gospels in 30 Days',
    description: 'Read Matthew, Mark, Luke, and John in one month.',
    durationDays: 30,
    icon: '✨',
    chaptersPerDay: 3,
    books: [40, 41, 42, 43],
  },
]

// Given a plan template and a start date, return today's assignment
export function getTodayAssignment(
  template: PlanTemplate,
  startDate: string // YYYY-MM-DD
): { bookId: number; bookName: string; chapters: number[] } | null {
  const start = new Date(startDate)
  const now = new Date()
  const dayNum = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (dayNum < 0 || dayNum >= template.durationDays) return null

  const books = template.books
    ? BIBLE_BOOKS.filter((b) => template.books!.includes(b.id))
    : BIBLE_BOOKS

  // Build a flat list of all chapters
  const allChapters: { bookId: number; bookName: string; chapter: number }[] = []
  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ bookId: book.id, bookName: book.name, chapter: ch })
    }
  }

  const perDay = Math.ceil(allChapters.length / template.durationDays)
  const start_ = dayNum * perDay
  const todayChapters = allChapters.slice(start_, start_ + perDay)
  if (!todayChapters.length) return null

  // Group by first book (simplification)
  return {
    bookId: todayChapters[0].bookId,
    bookName: todayChapters[0].bookName,
    chapters: todayChapters.map((c) => c.chapter),
  }
}
