-- Book overviews: author, date, audience, purpose, key themes, outline, key verses
create table if not exists book_overviews (
  book_id        integer primary key,
  book_name      text not null,
  author         text,
  date_written   text,
  audience       text,
  purpose        text,
  key_themes     text[],       -- array of theme strings
  outline        jsonb,        -- [{range: '1:1-18', title: 'Prologue'}, ...]
  key_verses     jsonb,        -- [{ref: '1:1', text: '"In the beginning..."'}, ...]
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Chapter overviews: brief summary, key ideas, connections for each chapter
create table if not exists chapter_overviews (
  id             bigserial primary key,
  book_id        integer not null,
  chapter_number integer not null,
  summary        text,
  key_ideas      text[],
  connections    text,         -- brief note on OT/NT connections in this chapter
  created_at     timestamptz default now(),
  unique(book_id, chapter_number)
);

-- Enable read access for everyone (content is not user-specific)
alter table book_overviews enable row level security;
alter table chapter_overviews enable row level security;

create policy "public read book_overviews" on book_overviews
  for select using (true);

create policy "public read chapter_overviews" on chapter_overviews
  for select using (true);
