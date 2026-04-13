-- Study notes: free-form chapter-level notes, separate from per-verse notes
CREATE TABLE IF NOT EXISTS study_notes (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id        INT         NOT NULL,
  chapter_number INT         NOT NULL,
  content        TEXT        NOT NULL DEFAULT '',
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, book_id, chapter_number)
);

ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study notes"
  ON study_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_study_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER study_notes_updated_at
  BEFORE UPDATE ON study_notes
  FOR EACH ROW EXECUTE FUNCTION update_study_notes_timestamp();
