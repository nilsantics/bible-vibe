-- ============================================================
-- Full setup: book_overviews + chapter_overviews + patristic tables
-- Run this once in Supabase SQL editor
-- ============================================================

-- Book overviews (with summary column included from the start)
create table if not exists book_overviews (
  book_id        integer primary key,
  book_name      text not null,
  author         text,
  date_written   text,
  audience       text,
  purpose        text,
  summary        text,
  key_themes     text[],
  outline        jsonb,
  key_verses     jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Chapter overviews
create table if not exists chapter_overviews (
  id             bigserial primary key,
  book_id        integer not null,
  chapter_number integer not null,
  summary        text,
  key_ideas      text[],
  connections    text,
  created_at     timestamptz default now(),
  unique(book_id, chapter_number)
);

-- Patristic writings (Church Fathers texts stored natively)
create table if not exists patristic_writings (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  father_name    text not null,
  title          text not null,
  era            text,
  tradition      text,
  description    text,
  total_sections integer default 0,
  created_at     timestamptz default now()
);

create table if not exists patristic_sections (
  id             uuid primary key default gen_random_uuid(),
  writing_id     uuid not null references patristic_writings(id) on delete cascade,
  section_number integer not null,
  title          text,
  content        text not null,
  unique (writing_id, section_number)
);

-- RLS
alter table book_overviews      enable row level security;
alter table chapter_overviews   enable row level security;
alter table patristic_writings  enable row level security;
alter table patristic_sections  enable row level security;

-- Public read (content is not user-specific)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'book_overviews' and policyname = 'public read book_overviews') then
    create policy "public read book_overviews" on book_overviews for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'chapter_overviews' and policyname = 'public read chapter_overviews') then
    create policy "public read chapter_overviews" on chapter_overviews for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'patristic_writings' and policyname = 'public read patristic_writings') then
    create policy "public read patristic_writings" on patristic_writings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'patristic_sections' and policyname = 'public read patristic_sections') then
    create policy "public read patristic_sections" on patristic_sections for select using (true);
  end if;
end $$;

-- Indexes
create index if not exists patristic_sections_writing on patristic_sections (writing_id, section_number);
