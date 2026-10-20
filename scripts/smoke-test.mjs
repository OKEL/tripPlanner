#!/usr/bin/env node
// End-to-end check of the deployed Edge Functions: create → get → refine → undo → redo → place info,
// plus the input checks. Run after every deploy:  node scripts/smoke-test.mjs
// Creates one small trip (creator "smoke"). Reads mobile/.env like eval-samples.mjs. Exit code 1 on failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
try {
  for (const line of readFileSync(join(root, 'mobile/.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  // No .env: rely on the environment.
}

async function call(name, body) {
  const started = Date.now();
  const res = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null), ms: Date.now() - started };
}

let failed = 0;
function expect(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
}
const dayCount = (trip) => trip.plan.events.filter((e) => e.type === 'day').length;

const text = 'Lisbon weekend\nDay 1: Belém Tower, Alfama\nDay 2: Sintra, Pena Palace\nDay 3: LX Factory, fly home 18:00';

const created = await call('create-trip', { text, creator_name: 'smoke', today: '2026-10-12' });
expect('create-trip', created.status === 200 && dayCount(created.body.trip) === 3, `${created.status}, ${created.ms}ms`);
if (created.status !== 200) process.exit(1);
const { trip, owner_token } = created.body;
expect('no owner hash in the response', !JSON.stringify(created.body.trip).includes('owner_token_hash'));
expect('source_kind is returned', created.body.trip.source_kind === 'text');

const got = await call('get-trip', { share_codes: [trip.share_code.toLowerCase(), 'ZZZZZZ'] });
expect('get-trip finds the code (any case) and reports the missing one', got.status === 200 && got.body.trips.length === 1 && got.body.missing.includes('ZZZZZZ'), `${got.status}`);

const refined = await call('refine-trip', { trip_id: trip.id, owner_token, instruction: 'remove day 2' });
expect('refine-trip applies the instruction', refined.status === 200 && dayCount(refined.body.trip) === 2 && refined.body.trip.can_undo, `${refined.status}, ${refined.ms}ms`);

const undone = await call('refine-trip', { trip_id: trip.id, owner_token, undo: true });
expect('undo restores the previous plan', undone.status === 200 && dayCount(undone.body.trip) === 3 && undone.body.trip.can_redo, `${undone.status}`);

const redone = await call('refine-trip', { trip_id: trip.id, owner_token, redo: true });
expect('redo brings the change back', redone.status === 200 && dayCount(redone.body.trip) === 2, `${redone.status}`);

const notOwner = await call('refine-trip', { trip_id: trip.id, owner_token: 'wrong', undo: true });
expect('a wrong owner token is rejected', notOwner.status === 403, `${notOwner.status}`);

const badId = await call('refine-trip', { trip_id: 'not-a-uuid', owner_token: 'x', undo: true });
expect('a malformed trip id is a 404', badId.status === 404, `${badId.status}`);

const notObject = await call('get-trip', '[]');
expect('a non-object body is a 400', notObject.status === 400, `${notObject.status}`);

const place = await call('place-info', { place_query: 'Belém Tower, Lisbon' });
expect('place-info returns a summary', place.status === 200 && typeof place.body.summary === 'string', `${place.status}, cached: ${place.body?.cached}, ${place.ms}ms`);

const placeHe = await call('place-info', { place_query: 'Belém Tower, Lisbon', lang: 'he' });
const placeEn = await call('place-info', { place_query: 'Belém Tower, Lisbon', lang: 'en' });
expect('place-info lang=he returns Hebrew text', placeHe.status === 200 && /[\u0590-\u05FF]/.test(placeHe.body?.summary ?? ''), `${placeHe.status}`);
expect('place-info lang=en returns Latin text (cache is split by language)', placeEn.status === 200 && !/[\u0590-\u05FF]/.test(placeEn.body?.summary ?? ''), `${placeEn.status}`);

console.log(failed ? `\n${failed} failed` : '\nAll passed');
process.exit(failed ? 1 : 0);
