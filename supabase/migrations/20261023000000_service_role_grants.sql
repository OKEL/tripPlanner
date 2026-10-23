-- Explicit table access for the Edge Functions (service role).
-- From 2026-10-30 Supabase no longer grants Data API access to new public tables automatically,
-- so a fresh project or `supabase db reset` needs these. No-op where the grants already exist.
-- anon/authenticated get nothing: the app never reads tables directly.
grant select, insert, update, delete on public.trips to service_role;
grant select, insert, update, delete on public.place_info to service_role;
