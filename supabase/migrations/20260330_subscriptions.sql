-- Stripe subscription tracking
-- Run via: SUPABASE_ACCESS_TOKEN=... npx supabase db query --linked -f supabase/migrations/20260330_subscriptions.sql

create table if not exists subscriptions (
  id                    text        primary key,  -- Stripe subscription ID (sub_xxx)
  user_id               uuid        not null references auth.users(id) on delete cascade,
  stripe_customer_id    text        not null,
  status                text        not null,     -- active | canceled | past_due | trialing | incomplete
  price_id              text        not null,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_idx on subscriptions (user_id);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Also store Stripe customer ID on profiles so we can look up users by customer
alter table profiles
  add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_id_idx
  on profiles (stripe_customer_id);
