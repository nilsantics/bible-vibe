-- Email waitlist for visitors not ready to sign up
create table if not exists public.waitlist (
  email      text primary key,
  created_at timestamptz default now() not null
);

-- Only service role can read/write (no public access)
alter table public.waitlist enable row level security;
