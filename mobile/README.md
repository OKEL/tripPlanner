# TripPlan app (Expo)

The React Native app. Overview, architecture and setup: [`../README.md`](../README.md). Design: [`../docs/DESIGN.md`](../docs/DESIGN.md). Setup from scratch: [`../docs/SETUP.md`](../docs/SETUP.md).

```bash
cp .env.example .env     # EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start           # scan the QR with Expo Go
```

Checks:

```bash
npx tsc --noEmit
npx expo lint
npm test                 # unit tests for src/lib (Node test runner)
```

Layout: routes in `src/app/` (Expo Router), shared UI in `src/components/`, logic without UI in `src/lib/`, design tokens in `src/theme.ts`.
After editing a sample in `docs/samples/`, run `node scripts/gen-samples.js`.
