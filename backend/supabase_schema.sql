-- Run this in the Supabase SQL editor to enable persistent storage.
-- Without it, the backend transparently falls back to an in-memory store
-- (see app/services/supabase_client.py) — the API still works, it just
-- won't survive a restart.

create table if not exists portfolios (
  wallet_address text primary key,
  holdings jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists alert_history (
  id uuid primary key default gen_random_uuid(),
  wallet_address text references portfolios (wallet_address),
  alert jsonb not null,
  created_at timestamptz not null default now()
);
