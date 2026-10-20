# TripPlan

Trip plan sharing app MVP (Expo + Supabase + Claude). Status: paused; see `docs/ROADMAP.md`.

**Read `docs/DESIGN.md` first** (product spec, architecture, data model, API, AI design, decision log). Setup and operations: `docs/SETUP.md`. What is built and what comes next: `docs/ROADMAP.md`.

## Working rules

- Decision changes go into `docs/DESIGN.md` (the relevant section + the Decision log) before code.
- Every change ends in a working state: `npx tsc --noEmit`, `npx expo lint`, `npm test` in `mobile/`, and `deno test supabase/functions/_tests/` pass.
- Schema changes: a new migration file, then update `docs/DESIGN.md` 2.4 and `supabase/functions/_shared/db.ts`.
- Changing the persisted store shape: bump `version` in `mobile/src/store.ts` and extend `migrate`.
- The Anthropic API key lives only in Supabase Edge Function secrets. Never in the app, never in the repo.
- Testing path: Android phone with Expo Go. No Xcode.
- UI text goes through the dictionaries in `mobile/src/i18n/` (English and Hebrew). Trip content may be Hebrew: run every content-rendering change against the Hebrew sample.
