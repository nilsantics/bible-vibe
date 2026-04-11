-- Add summary column to book_overviews
alter table book_overviews add column if not exists summary text;

-- Patristic writings: Church Fathers texts stored natively
create table if not exists patristic_writings (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  father_name  text not null,
  title        text not null,
  era          text,
  tradition    text,
  description  text,
  total_sections integer default 0,
  created_at   timestamptz default now()
);

create table if not exists patristic_sections (
  id            uuid primary key default gen_random_uuid(),
  writing_id    uuid not null references patristic_writings(id) on delete cascade,
  section_number integer not null,
  title         text,
  content       text not null,
  unique (writing_id, section_number)
);

-- Public read access (content is not user-specific)
alter table patristic_writings  enable row level security;
alter table patristic_sections  enable row level security;

create policy "public read patristic_writings"  on patristic_writings  for select using (true);
create policy "public read patristic_sections"  on patristic_sections  for select using (true);

-- Indexes
create index if not exists patristic_sections_writing on patristic_sections (writing_id, section_number);
