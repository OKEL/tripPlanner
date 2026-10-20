-- Trips: one row per shared trip plan. Accessed only through Edge Functions (service role).
create table public.trips (
  id               uuid primary key default gen_random_uuid(),
  share_code       text not null unique,
  title            text not null,
  creator_name     text,
  source_text      text not null,
  source_kind      text not null check (source_kind in ('text', 'pdf')),
  plan             jsonb not null,
  previous_plan    jsonb,            -- one level of Undo for refinement
  owner_token_hash text not null,    -- sha256 (hex) of the owner token
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Cache of AI-generated place summaries ("More info"), keyed by normalized place query.
create table public.place_info (
  place_key   text primary key,
  summary     text not null,
  model       text not null,
  created_at  timestamptz not null default now()
);

-- RLS on with no policies: anon/authenticated clients can't read or write directly.
-- Edge Functions use the service role, which bypasses RLS.
alter table public.trips enable row level security;
alter table public.place_info enable row level security;
