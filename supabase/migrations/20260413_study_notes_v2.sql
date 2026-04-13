-- Study notes v2: multiple titled notes per user, not locked to one per chapter
ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS title     TEXT        NOT NULL DEFAULT 'Untitled Note';
ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS book_name TEXT;
ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Drop the one-note-per-chapter unique constraint so users can have many notes
ALTER TABLE study_notes DROP CONSTRAINT IF EXISTS study_notes_user_id_book_id_chapter_number_key;

-- Allow notes that aren't tied to a specific chapter
ALTER TABLE study_notes ALTER COLUMN book_id        DROP NOT NULL;
ALTER TABLE study_notes ALTER COLUMN chapter_number DROP NOT NULL;
