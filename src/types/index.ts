// ============================================================
// Bible Vibe — Core TypeScript Types
// ============================================================

// ---- Bible Structure ----------------------------------------

export interface Book {
  id: number
  name: string
  abbreviation: string
  testament: 'Old' | 'New'
  chapter_count: number
  display_order: number
}

export interface Chapter {
  id: number
  book_id: number
  chapter_number: number
  verse_count: number
}

export interface Verse {
  id: number
  book_id: number
  chapter_id?: number
  chapter_number: number
  verse_number: number
  text: string
  translation_id: number
  translation_code?: string // 'WEB' | 'KJV' | 'ESV'
}

export interface Translation {
  id: number
  code: string // 'WEB', 'KJV', 'ESV'
  name: string // 'World English Bible', etc.
  is_public_domain: boolean
}

// ---- User Data -----------------------------------------------

export interface Profile {
  id: string
  username: string
  email?: string
  bio?: string
  avatar_url?: string
  theme: 'light' | 'dark' | 'system'
  preferred_translation: string
  created_at: string
  updated_at: string
}

export interface Highlight {
  id: string
  user_id: string
  verse_id: number
  color: HighlightColor
  created_at: string
  updated_at: string
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple'

export interface Note {
  id: string
  user_id: string
  verse_id: number
  content: string
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  verse_id: number
  folder: string
  created_at: string
}

// ---- Reading Progress -----------------------------------------

export interface ReadingProgress {
  id: string
  user_id: string
  book_id: number
  chapter_number: number
  verse_number: number
  reading_date: string
  duration_seconds?: number
}

// ---- Gamification --------------------------------------------

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  best_streak: number
  last_read_date: string | null
  updated_at: string
}

export interface UserXP {
  id: string
  user_id: string
  total_xp: number
  level: number
  updated_at: string
}

export interface Badge {
  id: number
  name: string
  description: string
  icon: string // emoji or lucide icon name
  requirement_type: string
  requirement_value: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: number
  unlocked_at: string
  badge?: Badge
}

// ---- Reading Plans -------------------------------------------

export interface ReadingPlan {
  id: string
  user_id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  plan_type: PlanType
  created_at: string
}

export type PlanType =
  | 'ot_1_year'
  | 'nt_90_days'
  | 'bible_1_year'
  | 'nt_1_year'
  | 'psalms_proverbs'
  | 'custom'

export interface ReadingPlanEntry {
  id: string
  plan_id: string
  day_number: number
  assigned_date: string
  book_id: number
  chapter_start: number
  verse_start: number
  chapter_end: number
  verse_end: number
  is_completed: boolean
  completed_at?: string
}

// ---- Memorization (SM-2) ------------------------------------

export interface MemorizationCard {
  id: string
  user_id: string
  verse_id: number
  difficulty: number   // ease factor, default 2.5
  interval: number     // days until next review
  repetitions: number
  due_date: string
  last_reviewed_at?: string
  created_at: string
  verse?: Verse
}

// ---- AI Chat ------------------------------------------------

export interface ChatMessage {
  id: string
  user_id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  context_verses?: number[] // verse IDs used as context
  created_at: string
}

// ---- UI State -----------------------------------------------

export interface VerseWithMeta extends Verse {
  highlight?: Highlight
  note?: Note
  is_bookmarked?: boolean
}

export interface BibleLocation {
  bookId: number
  bookName: string
  chapter: number
  verse?: number
}

export interface WordStudy {
  word: string
  strongsNumber?: string
  originalWord?: string
  transliteration?: string
  definition?: string
  partOfSpeech?: string
  morphology?: string
  occurrences?: number
}

export interface VerseContext {
  summary: string
  historicalContext: string
  theologicalNote: string
  aneContext?: string
  crossReferences?: CrossReference[]
}

export interface CrossReference {
  reference: string
  bookId: number
  chapter: number
  verse: number
  text: string
  connectionType: 'thematic' | 'verbal' | 'typological'
}

// ---- XP Events ----------------------------------------------

export type XPEvent =
  | 'read_chapter'
  | 'read_5_chapters'
  | 'add_highlight'
  | 'add_note'
  | 'add_bookmark'
  | 'complete_quiz'
  | 'memorize_verse'
  | 'use_ai_chat'
  | 'complete_reading_plan_day'
  | 'maintain_streak_7'
  | 'maintain_streak_30'

export const XP_VALUES: Record<XPEvent, number> = {
  read_chapter: 25,
  read_5_chapters: 60,
  add_highlight: 5,
  add_note: 10,
  add_bookmark: 3,
  complete_quiz: 20,
  memorize_verse: 50,
  use_ai_chat: 15,
  complete_reading_plan_day: 30,
  maintain_streak_7: 100,
  maintain_streak_30: 500,
}

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Seeker', min: 0 },
  { level: 2, name: 'Scripture Student', min: 500 },
  { level: 3, name: 'Bible Reader', min: 1500 },
  { level: 4, name: 'Verse Keeper', min: 3500 },
  { level: 5, name: 'Scholar', min: 7000 },
  { level: 6, name: 'Theologian', min: 12000 },
  { level: 7, name: 'Sage', min: 18000 },
  { level: 8, name: 'Master Interpreter', min: 25000 },
]
