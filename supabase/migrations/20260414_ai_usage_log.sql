create table if not exists ai_usage_log (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users(id) on delete set null,
  route           text        not null,
  feature         text        not null,
  model           text        not null,
  input_tokens    integer     not null default 0,
  output_tokens   integer     not null default 0,
  created_at      timestamptz not null default now()
);

-- Index for per-user queries and time-range analytics
create index if not exists ai_usage_log_user_id_idx  on ai_usage_log(user_id);
create index if not exists ai_usage_log_created_at_idx on ai_usage_log(created_at desc);
create index if not exists ai_usage_log_model_idx     on ai_usage_log(model);

-- RLS: only service role can write; admins can read all
alter table ai_usage_log enable row level security;
create policy "service role full access" on ai_usage_log using (true) with check (true);
