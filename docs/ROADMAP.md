# Roadmap

Where the project stands, what is known to be rough, and what would come next.

**Status (October 2026): paused.** The MVP is complete and runs on an Android phone (Expo Go and a standalone APK). The code, the backend and the docs are in a working state; nothing is half-built.

## Built

Built in three days (2026-10-11 to 2026-10-13), in this order:

| Milestone | What |
| --- | --- |
| Backend core | Schema with RLS, shared Zod plan schema, extraction prompt with structured output + checks + one retry, `create-trip`, `get-trip` |
| App core | Create screen, My Trips, Trip Plan timeline, persisted store, per-text RTL for content |
| Timeline details | Day accordion, activity sheet, Open in Maps, Today highlight + auto-open |
| Sharing | Share code + share sheet + copy, Join (also from a pasted share message), refetch on start/foreground, pull-to-refresh, offline / error notes, "unavailable" trips |
| More info | `place-info` with a server-side cache; AI label in the sheet |
| Refinement | `refine-trip` with owner-token check; proactive prompt with an assumption note; Undo and Redo |
| Polish | Display name prompt, Settings, Remove from device, View original text, Participants (placeholder), Load sample, empty and error states |
| File attach | `.txt` into the text box; `.pdf` text extracted on the server; clear error for scanned PDFs |
| Design pass | Theme tokens, teal palette, Heebo font, day cards, trip avatars, app icon and splash |
| Hardening | 30-item review: time budgets, explicit columns, UUID checks, store migrations, shared Dialog/BottomSheet, error boundary, `ai_call` logging |
| Tests and CI | Unit tests (app and functions), app/server contract test, smoke test, sample eval, GitHub Actions |
| UI languages | English and Hebrew UI through typed dictionaries; AI summaries and notes in the UI language ([I18N.md](I18N.md)) |
| Standalone build | Android APK through EAS Build |

Extraction quality on the seven samples: [samples/README.md](samples/README.md).

## Known limitations

- **No accounts.** Anyone with a share code can view a trip, forever. The owner token lives on one device: losing the phone (or reinstalling the app) loses the ability to edit.
- **No rate limiting.** The only cost protection is the input limits, the place cache, and the spend cap on the Anthropic key. The public function URLs could be called by anyone who has the publishable key (it ships in the app).
- **No real-time sync.** Viewers see changes on the next app start, foreground or pull-to-refresh.
- **Only one level of history** (Undo/Redo between two versions).
- **Hebrew UI is not mirrored.** Strings are Hebrew but the layout stays left-to-right.
- **iOS not tested.** The code has iOS paths (maps action sheet, `writingDirection`) but was only run on Android.
- **Bottom sheets can't be dragged to close** (tap outside, Android back or Close work).
- **Create screen with the keyboard open** on small Android screens: the button may be covered (`KeyboardAvoidingView` has no Android behavior set). Not confirmed.
- **After a refetch that changes the plan structure**, the open day is kept by position and may point at a different day. Harmless: it resets when you tap a day.
- **Extraction varies between runs** on long inputs (for example 51-69 activities for the 21-day sample). Nothing is invented, but grouping differs.

## Next steps

Roughly in priority order, if the project is picked up again:

1. **Rate limiting and abuse protection** before any public release: per-device limits on `create-trip` and `refine-trip`, a global daily counter, maybe Supabase Auth anonymous sign-in so each device has an identity.
2. **Accounts and permissions:** sign-in, owner recovery across devices, invites, editors, revoking access, code regeneration and expiry.
3. **Manual editing** of activities and days, next to AI refinement.
4. **Real-time updates** (Supabase Realtime) and push notifications when a shared plan changes.
5. **Version history** beyond one Undo.
6. **Full RTL layout** for the Hebrew UI ([I18N.md](I18N.md) section 5 has the plan).
7. **Map view** of a day or the whole trip; grouping consecutive days by city.
8. **Extraction evals in CI** (a scheduled run of `eval-samples.mjs` with a dedicated key), and more samples (scans via OCR, emails, booking confirmations).
9. **Deep links** (`tripplan://join/K7QX3M` or app links), which need a development or production build.
10. **iOS build** and a check on an iPhone.
11. **Domain extensions:** the plan already knows destinations, dates and activities. It could, for example, flag activities that usually need extra travel insurance coverage (skiing, diving, car rental), or attach bookings and tickets to activities.

## Picking it up again

1. Read [DESIGN.md](DESIGN.md) (how it works and why) and this file.
2. Restore the Supabase project if it was paused (dashboard), then run `node scripts/smoke-test.mjs`. If models were retired, update the ids in `supabase/functions/_shared/claude.ts`, deploy, and run `node scripts/eval-samples.mjs`.
3. Update Expo: `cd mobile && npx expo install expo@latest --fix`, then `npx expo-doctor`, then the checks in [SETUP.md](SETUP.md#4-checks). Expo Go on the phone only runs the current SDK, so an old project may need this step before it opens at all.
4. Pick from the next steps above. Record decisions in the [DESIGN.md decision log](DESIGN.md#decision-log).
