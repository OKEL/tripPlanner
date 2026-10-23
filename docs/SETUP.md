# Setup

How to run TripPlan from scratch: your own Supabase project, your own Anthropic key, the app on a phone, and an installable Android build. About 30 minutes.

How the pieces fit together: [DESIGN.md](DESIGN.md) Part 2.

## What you need

| | Used for | Cost |
| --- | --- | --- |
| Node.js 24+ and npm | The app, the scripts, the Supabase CLI (`npx supabase`) | |
| [Supabase](https://supabase.com) account | Postgres + Edge Functions | Free tier is enough |
| [Anthropic API](https://console.anthropic.com) key | The AI calls (Edge Functions only) | Pay per use: a few cents per plan |
| Android phone with **Expo Go** | Running the app in development | |
| [Expo](https://expo.dev) account | Only for a standalone APK (EAS Build) | Free tier is enough |
| [Deno](https://deno.com) 2 | Optional: type checks and tests of the functions | |

Docker is **not** needed: the functions are deployed with `--use-api` and there is no local Supabase stack.

## Secrets and configuration

| Name | Where it lives | What it is |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Supabase Edge Function secrets | The Claude API key. **Never in the app or the repo** |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Injected by Supabase into every function | Nothing to set |
| `EXPO_PUBLIC_SUPABASE_URL` | `mobile/.env` (gitignored), and EAS env vars for builds | `https://<project-ref>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `mobile/.env`, and EAS env vars for builds | The project's **publishable** (or legacy anon) key. Safe to ship: RLS blocks direct table access |

The app reads only the two `EXPO_PUBLIC_*` values. Without them it shows "The app is not configured".

## 1. Backend (Supabase)

1. Create a project in the Supabase dashboard. Note the **project ref** (in the project URL) and the database password.
2. From the repository root, log in and link:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```
3. Create the tables. This applies `supabase/migrations/*.sql` in order (two tables, RLS on, no policies, access granted to `service_role` only; schema in [DESIGN.md 2.4](DESIGN.md#24-database)):
   ```bash
   npx supabase db push
   ```
   Without the CLI: paste the four migration files, in name order, into the dashboard's SQL editor.
4. Set the Anthropic key as a function secret:
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   Or keep it in a file named `*.secret.env` (gitignored) and run `npx supabase secrets set --env-file supabase/anthropic.secret.env`.
5. Deploy the four functions:
   ```bash
   npx supabase functions deploy --use-api
   ```
   `supabase/config.toml` sets `verify_jwt = false` for each one (the app sends a publishable key, which is not a JWT). If you deploy from the dashboard instead, turn off "Enforce JWT verification" for every function.
6. In the Anthropic Console, set a **monthly spend limit** on the key. The functions have input limits but no rate limiting.

Check it with curl (or run the smoke test after step 2 below):

```bash
curl -s https://<project-ref>.supabase.co/functions/v1/create-trip \
  -H "apikey: <publishable-key>" -H "Content-Type: application/json" \
  -d '{"text":"Day 1: Rome, Colosseum\nDay 2: Vatican"}'
```

## 2. App (development, Expo Go)

```bash
cd mobile
cp .env.example .env      # fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start            # scan the QR code with Expo Go
```

The phone and the computer must be on the same network (or use `npx expo start --tunnel`).
`npx expo start --web` also works for quick UI checks in a browser, but the target is Android.

Then, from the repository root, check the whole backend end to end (creates one small trip with creator "smoke"):

```bash
node scripts/smoke-test.mjs
```

## 3. Standalone Android APK (EAS Build)

The repository is linked to the original author's Expo project (`owner` and `extra.eas.projectId` in `mobile/app.json`). To build under your own account:

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init                 # links to your Expo project; replaces owner and projectId in app.json
```

Change `android.package` in `app.json` (`com.ofek.tripplan`) to your own identifier, then add the two public values as EAS environment variables for the `preview` environment (the build doesn't read `.env`):

```bash
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://<project-ref>.supabase.co --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <publishable-key> --visibility plaintext
npx eas-cli@latest build --platform android --profile preview
```

The build runs in the cloud (~10-15 minutes) and ends with a download link and QR code for the APK. Install it on the phone (allow installs from unknown sources). App icon and splash only show in a real build; Expo Go shows its own.

## 4. Checks

```bash
# app
cd mobile && npx tsc --noEmit && npx expo lint && npm test

# functions (needs Deno)
deno check supabase/functions/*/index.ts
deno test supabase/functions/_tests/

# against the deployed backend (reads mobile/.env)
node scripts/smoke-test.mjs          # every endpoint end to end; run after each deploy
node scripts/eval-samples.mjs        # extraction quality on all samples (creates one trip per sample, creator "eval")
node scripts/eval-samples.mjs 01 04  # only some samples
```

GitHub Actions (`.github/workflows/ci.yml`) runs the type checks, lint and unit tests on every push. It needs no secrets: nothing in CI calls Supabase or Claude.

## 5. Operations

- **Logs:** Supabase dashboard → Edge Functions → a function → Logs. Every AI call writes one JSON line with `"event":"ai_call"`, the task, model, tokens and latency.
- **Changing the schema:** add a new file to `supabase/migrations/` (`YYYYMMDDHHMMSS_name.sql`), run `npx supabase db push`, update [DESIGN.md 2.4](DESIGN.md#24-database), the row type in `supabase/functions/_shared/db.ts`, and, if the public trip shape changes, `mobile/src/types/plan.ts` (the contract test catches a mismatch).
- **Deploy order** for changes that touch several layers: migration → functions → app. Keep each step backward compatible with the previous app build, since installed apps don't update themselves.
- **Changing the persisted app state:** bump `version` in `mobile/src/store.ts` and handle the old shape in `migrate`.
- **Editing a sample:** after changing `docs/samples/*.txt`, run `node scripts/gen-samples.js` in `mobile/` to regenerate `src/lib/samples.ts`.
- **Test data:** the smoke test and the eval create real trips. To clean them up, in the SQL editor:
  ```sql
  delete from public.trips where creator_name in ('smoke', 'eval', 'test');
  ```
- **Pausing:** a free Supabase project is paused after about a week without activity. Restore it from the dashboard; data is kept. Installed apps show their cached trips in the meantime ("Offline · showing saved copy" or "Couldn't refresh").
- **Updating models:** model ids are constants at the top of `supabase/functions/_shared/claude.ts`. After a change, run `eval-samples.mjs` and compare with [samples/README.md](samples/README.md).
