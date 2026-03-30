-- AI usage tracking for rate limiting
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard → SQL Editor

create table if not exists ai_usage (
  user_id  uuid    not null references auth.users(id) on delete cascade,
  date     date    not null default current_date,
  chat_count  integer not null default 0,
  primary key (user_id, date)
);

alter table ai_usage enable row level security;

-- Users can only read their own usage (for display in settings/UI)
create policy "Users can view own ai_usage"
  on ai_usage for select
  using (auth.uid() = user_id);

-- Index for fast daily lookups
create index if not exists ai_usage_user_date_idx on ai_usage (user_id, date);
