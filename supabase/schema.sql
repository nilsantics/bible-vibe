-- ============================================================
-- Bible Vibe — Supabase Database Schema
-- Run this in your Supabase SQL editor (supabase.com/dashboard)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector for semantic search

-- ============================================================
-- BIBLE DATA TABLES (public, no RLS needed)
-- ============================================================

CREATE TABLE IF NOT EXISTS translations (
  id   SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,  -- 'WEB', 'KJV', 'ESV'
  name TEXT NOT NULL,
  is_public_domain BOOLEAN DEFAULT TRUE
);

INSERT INTO translations (code, name, is_public_domain) VALUES
  ('WEB', 'World English Bible',  TRUE),
  ('KJV', 'King James Version',   TRUE),
  ('ESV', 'English Standard Version', FALSE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS books (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  abbreviation  TEXT UNIQUE NOT NULL,
  testament     TEXT NOT NULL CHECK (testament IN ('Old', 'New')),
  chapter_count INT  NOT NULL,
  display_order INT  NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS chapters (
  id             SERIAL PRIMARY KEY,
  book_id        INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  verse_count    INT NOT NULL DEFAULT 0,
  UNIQUE(book_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS verses (
  id             SERIAL PRIMARY KEY,
  book_id        INT  NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id     INT  REFERENCES chapters(id) ON DELETE SET NULL,
  chapter_number INT  NOT NULL,
  verse_number   INT  NOT NULL,
  text           TEXT NOT NULL,
  translation_id INT  NOT NULL REFERENCES translations(id),
  UNIQUE(book_id, chapter_number, verse_number, translation_id)
);

-- Full-text search index on verse text
CREATE INDEX IF NOT EXISTS idx_verses_fts
  ON verses USING GIN (to_tsvector('english', text));

-- Covering index for fast chapter lookups
CREATE INDEX IF NOT EXISTS idx_verses_chapter
  ON verses(book_id, chapter_number, translation_id, verse_number);

-- Semantic search: pgvector embeddings (1536-dim, OpenAI text-embedding-3-small)
CREATE TABLE IF NOT EXISTS verse_embeddings (
  id         SERIAL PRIMARY KEY,
  verse_id   INT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  embedding  VECTOR(1536),
  UNIQUE(verse_id)
);

CREATE INDEX IF NOT EXISTS idx_verse_embeddings_hnsw
  ON verse_embeddings USING HNSW (embedding VECTOR_COSINE_OPS);

-- ============================================================
-- USER PROFILE (extends Supabase auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,
  bio                   TEXT,
  avatar_url            TEXT,
  theme                 TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  preferred_translation TEXT NOT NULL DEFAULT 'WEB',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- USER STUDY DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS highlights (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id   INT  NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  color      TEXT NOT NULL DEFAULT 'yellow'
               CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'purple')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id   INT  NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id   INT  NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  folder     TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id, folder)
);

-- ============================================================
-- READING PROGRESS
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_progress (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id          INT  NOT NULL REFERENCES books(id),
  chapter_number   INT  NOT NULL,
  reading_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id, chapter_number, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user
  ON reading_progress(user_id, reading_date DESC);

-- ============================================================
-- GAMIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS streaks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  INT  NOT NULL DEFAULT 0,
  best_streak     INT  NOT NULL DEFAULT 0,
  last_read_date  DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS user_xp (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp   INT  NOT NULL DEFAULT 0,
  level      INT  NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL UNIQUE,
  description        TEXT NOT NULL,
  icon               TEXT NOT NULL DEFAULT '🏆',
  requirement_type   TEXT NOT NULL,
  requirement_value  INT  NOT NULL DEFAULT 1,
  rarity             TEXT NOT NULL DEFAULT 'common'
                       CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    INT  NOT NULL REFERENCES badges(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Seed starter badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, rarity) VALUES
  ('First Steps',      'Read your first chapter',            '📖', 'chapters_read',  1,   'common'),
  ('Bookworm',         'Read 10 chapters',                   '📚', 'chapters_read',  10,  'common'),
  ('Week Warrior',     'Maintain a 7-day streak',            '🔥', 'streak_days',    7,   'common'),
  ('Month Maven',      'Maintain a 30-day streak',           '⚡', 'streak_days',    30,  'rare'),
  ('Century Club',     'Maintain a 100-day streak',          '💫', 'streak_days',    100, 'epic'),
  ('Yearly Yogi',      'Maintain a 365-day streak',          '🌟', 'streak_days',    365, 'legendary'),
  ('Note Taker',       'Write 10 study notes',               '✍️', 'notes_written',  10,  'common'),
  ('Highlighter',      'Highlight 25 verses',                '🖊️', 'highlights_made',25,  'common'),
  ('Memory Keeper',    'Memorize 10 verses',                 '🧠', 'verses_memorized',10, 'rare'),
  ('OT Explorer',      'Read every OT book at least once',   '📜', 'ot_books_read',  39,  'epic'),
  ('NT Explorer',      'Read every NT book at least once',   '✝️', 'nt_books_read',  27,  'epic'),
  ('Bible Complete',   'Read all 66 books',                  '👑', 'books_read',     66,  'legendary'),
  ('Scholar',          'Reach level 5',                      '🎓', 'level',          5,   'rare'),
  ('Quiz Master',      'Score 100% on 5 quizzes',            '🎯', 'perfect_quizzes',5,   'rare'),
  ('Deep Seeker',      'Ask 50 questions to the AI',         '🔍', 'ai_questions',   50,  'common')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- READING PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  plan_type   TEXT NOT NULL DEFAULT 'custom',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_plan_entries (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id        UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number     INT  NOT NULL,
  assigned_date  DATE NOT NULL,
  book_id        INT  NOT NULL REFERENCES books(id),
  chapter_start  INT  NOT NULL,
  verse_start    INT  NOT NULL DEFAULT 1,
  chapter_end    INT  NOT NULL,
  verse_end      INT  NOT NULL DEFAULT 999,
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  UNIQUE(plan_id, day_number)
);

-- ============================================================
-- VERSE MEMORIZATION (SM-2 Spaced Repetition)
-- ============================================================

CREATE TABLE IF NOT EXISTS memorization_cards (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id         INT   NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  difficulty       FLOAT NOT NULL DEFAULT 2.5,   -- ease factor
  interval         INT   NOT NULL DEFAULT 0,      -- days until next review
  repetitions      INT   NOT NULL DEFAULT 0,
  due_date         DATE  NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

-- ============================================================
-- AI CHAT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  context_verses  JSONB,  -- array of verse IDs used as context
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages(user_id, conversation_id, created_at);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Highlights
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "highlights_select" ON highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "highlights_insert" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "highlights_update" ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "highlights_delete" ON highlights FOR DELETE USING (auth.uid() = user_id);

-- Notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_select" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notes_insert" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notes_delete" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_select" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_update" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Reading progress
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select" ON reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert" ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON reading_progress FOR UPDATE USING (auth.uid() = user_id);

-- Streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_select" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_all"    ON streaks FOR ALL    USING (auth.uid() = user_id);

-- User XP
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_select" ON user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xp_all"    ON user_xp FOR ALL    USING (auth.uid() = user_id);

-- User badges (read-only for users; write via server)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ubadges_select" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Reading plans
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select" ON reading_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plans_insert" ON reading_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plans_update" ON reading_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "plans_delete" ON reading_plans FOR DELETE USING (auth.uid() = user_id);

-- Plan entries
ALTER TABLE reading_plan_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_entries_all" ON reading_plan_entries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM reading_plans
    WHERE reading_plans.id = reading_plan_entries.plan_id
      AND reading_plans.user_id = auth.uid()
  ));

-- Memorization
ALTER TABLE memorization_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mem_select" ON memorization_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mem_insert" ON memorization_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mem_update" ON memorization_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mem_delete" ON memorization_cards FOR DELETE USING (auth.uid() = user_id);

-- Chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_select" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEMANTIC SEARCH FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION search_verses_semantic(
  query_embedding VECTOR(1536),
  match_count     INT DEFAULT 10,
  translation     TEXT DEFAULT 'WEB'
)
RETURNS TABLE (
  verse_id       INT,
  book_id        INT,
  chapter_number INT,
  verse_number   INT,
  text           TEXT,
  translation_id INT,
  similarity     FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    v.id            AS verse_id,
    v.book_id,
    v.chapter_number,
    v.verse_number,
    v.text,
    v.translation_id,
    1 - (ve.embedding <=> query_embedding) AS similarity
  FROM verse_embeddings ve
  JOIN verses v ON v.id = ve.verse_id
  JOIN translations t ON t.id = v.translation_id
  WHERE t.code = translation
  ORDER BY ve.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Full-text search function
CREATE OR REPLACE FUNCTION search_verses_text(
  query_text  TEXT,
  translation TEXT DEFAULT 'WEB',
  limit_count INT  DEFAULT 20
)
RETURNS TABLE (
  verse_id       INT,
  book_id        INT,
  chapter_number INT,
  verse_number   INT,
  text           TEXT,
  rank           FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    v.id,
    v.book_id,
    v.chapter_number,
    v.verse_number,
    v.text,
    ts_rank(to_tsvector('english', v.text), plainto_tsquery('english', query_text)) AS rank
  FROM verses v
  JOIN translations t ON t.id = v.translation_id
  WHERE t.code = translation
    AND to_tsvector('english', v.text) @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT limit_count;
$$;

-- ============================================================
-- CROSS REFERENCES (Treasury of Scripture Knowledge)
-- ============================================================
CREATE TABLE IF NOT EXISTS cross_references (
  id SERIAL PRIMARY KEY,
  from_book_id SMALLINT NOT NULL,
  from_chapter SMALLINT NOT NULL,
  from_verse   SMALLINT NOT NULL,
  to_book_id   SMALLINT NOT NULL,
  to_chapter   SMALLINT NOT NULL,
  to_verse     SMALLINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xref_from ON cross_references(from_book_id, from_chapter, from_verse);

-- ============================================================
-- STRONG'S CONCORDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS strongs_entries (
  number         TEXT PRIMARY KEY,   -- H1234 or G5678
  word           TEXT NOT NULL,      -- original Hebrew/Greek
  transliteration TEXT,
  pronunciation  TEXT,
  definition     TEXT NOT NULL,
  derivation     TEXT,
  kjv_usage      TEXT,
  testament      CHAR(2) NOT NULL    -- 'OT' or 'NT'
);

-- ============================================================
-- COMMENTARY (AI-generated, cached per chapter)
-- ============================================================
CREATE TABLE IF NOT EXISTS commentaries (
  id         SERIAL PRIMARY KEY,
  source     TEXT NOT NULL DEFAULT 'ai',
  book_id    SMALLINT NOT NULL,
  chapter    SMALLINT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commentary_unique ON commentaries(source, book_id, chapter);
CREATE INDEX  IF NOT EXISTS idx_commentary_lookup ON commentaries(book_id, chapter);

-- ============================================================
-- RAG COMMENTARY LIBRARY (Matthew Henry, Clarke, Gill, etc.)
-- Chunked public-domain commentary text with vector embeddings
-- ============================================================
CREATE TABLE IF NOT EXISTS commentary_chunks (
  id          SERIAL PRIMARY KEY,
  source      TEXT     NOT NULL,       -- 'matthew-henry', 'john-gill', etc.
  book_id     SMALLINT NOT NULL,
  chapter     SMALLINT NOT NULL,
  verse_start SMALLINT,               -- NULL = whole chapter
  verse_end   SMALLINT,
  heading     TEXT,
  content     TEXT     NOT NULL,
  embedding   VECTOR(1536),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commentary_chunks_ref    ON commentary_chunks(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_commentary_chunks_source ON commentary_chunks(source);
CREATE INDEX IF NOT EXISTS idx_commentary_chunks_hnsw
  ON commentary_chunks USING HNSW (embedding VECTOR_COSINE_OPS);

-- RAG search: semantic over commentary library
CREATE OR REPLACE FUNCTION search_commentary(
  query_embedding VECTOR(1536),
  p_book_id       SMALLINT DEFAULT NULL,
  p_chapter       SMALLINT DEFAULT NULL,
  match_count     INT      DEFAULT 5
)
RETURNS TABLE (
  id          INT,
  source      TEXT,
  book_id     SMALLINT,
  chapter     SMALLINT,
  verse_start SMALLINT,
  verse_end   SMALLINT,
  heading     TEXT,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id, c.source, c.book_id, c.chapter, c.verse_start, c.verse_end, c.heading, c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM commentary_chunks c
  WHERE c.embedding IS NOT NULL
    AND (p_book_id IS NULL OR c.book_id = p_book_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- CHURCH FATHERS — Patristic Writings
-- ============================================================
CREATE TABLE IF NOT EXISTS patristic_writings (
  id             SERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  father_name    TEXT NOT NULL,
  title          TEXT NOT NULL,
  era            TEXT,
  tradition      TEXT,
  description    TEXT,
  total_sections INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS patristic_sections (
  id             SERIAL PRIMARY KEY,
  writing_id     INT  NOT NULL REFERENCES patristic_writings(id) ON DELETE CASCADE,
  section_number INT  NOT NULL,
  title          TEXT,
  content        TEXT NOT NULL,
  UNIQUE(writing_id, section_number)
);
CREATE INDEX IF NOT EXISTS idx_patristic_sections_writing ON patristic_sections(writing_id, section_number);
