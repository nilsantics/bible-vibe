-- Verse tags: users can label any verse with custom topic tags
create table if not exists verse_tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  verse_id    bigint not null,
  tag_name    text not null check (char_length(tag_name) between 1 and 40),
  created_at  timestamptz not null default now(),
  unique (user_id, verse_id, tag_name)
);

-- RLS
alter table verse_tags enable row level security;

create policy "Users manage own tags"
  on verse_tags for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast tag lookups
create index if not exists verse_tags_user_verse on verse_tags (user_id, verse_id);
create index if not exists verse_tags_user_name  on verse_tags (user_id, tag_name);
