#!/usr/bin/env node
// Extraction check: sends every docs/samples/*.txt to the deployed create-trip function and checks the
// result against the expectations in docs/samples/README.md. Creates one trip per sample (creator "eval").
//
//   node scripts/eval-samples.mjs            # all samples
//   node scripts/eval-samples.mjs 01 04      # only samples whose file name starts with these
//
// Reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from mobile/.env (or the environment).
// Exit code 1 if any check fails.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(join(root, 'mobile/.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env: rely on the environment.
  }
  return env;
}

// Expectations per sample (see docs/samples/README.md). `dates`: exact day dates, or 'none' for all null.
const EXPECT = {
  '00': { days: 21, activities: [45, 75], dates: ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'] },
  '01': { days: 8, activities: [24, 30], dates: ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'] },
  '02': { days: 7, activities: [20, 30], dates: 'none' },
  '03': { days: 5, activities: [9, 16], dates: ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'] },
  '04': { days: 6, activities: [6, 14] },
  '05': { days: 4, activities: [8, 14] },
  '06': { days: 3, activities: [12, 12], noTimes: true },
};

async function createTrip(env, text) {
  const res = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-trip`, {
    method: 'POST',
    headers: { apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, creator_name: 'eval' }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body?.error?.code}: ${body?.error?.message}`);
  return body.trip;
}

/** Returns a list of failed checks (empty = pass). */
function check(id, source, plan) {
  const want = EXPECT[id];
  const failures = [];
  const days = plan.events.filter((e) => e.type === 'day');
  const activities = days.flatMap((d) => d.activities);

  if (days.length !== want.days) failures.push(`days: ${days.length}, expected ${want.days}`);
  const [min, max] = want.activities;
  if (activities.length < min || activities.length > max) {
    failures.push(`activities: ${activities.length}, expected ${min}-${max}`);
  }
  if (want.dates === 'none' && days.some((d) => d.date !== null)) failures.push('dates: expected all null');
  if (Array.isArray(want.dates) && JSON.stringify(days.map((d) => d.date)) !== JSON.stringify(want.dates)) {
    failures.push(`dates: ${days.map((d) => d.date).join(', ')}`);
  }
  if (want.noTimes && activities.some((a) => a.time !== null)) failures.push('times: expected all null');

  // Nothing invented: every clock time in the plan must appear in the source ("9:00" may be written "09:00").
  const sourceTimes = new Set([...source.matchAll(/(\d{1,2})[:.](\d{2})/g)].map((m) => `${Number(m[1])}:${m[2]}`));
  const allTimes = [...activities.map((a) => a.time), ...plan.events.map((e) => e.time)].filter(Boolean);
  for (const time of allTimes) {
    for (const m of String(time).matchAll(/(\d{1,2}):(\d{2})/g)) {
      if (!sourceTimes.has(`${Number(m[1])}:${m[2]}`)) failures.push(`invented time? ${time}`);
    }
  }
  return failures;
}

async function main() {
  const env = loadEnv();
  if (!env.EXPO_PUBLIC_SUPABASE_URL || !env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (mobile/.env).');
    process.exit(2);
  }
  const only = process.argv.slice(2);
  const dir = join(root, 'docs/samples');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.txt') && EXPECT[f.slice(0, 2)])
    .filter((f) => only.length === 0 || only.some((p) => f.startsWith(p)))
    .sort();

  let failed = 0;
  // Sequential on purpose: keeps the load on the API small and the latency numbers honest.
  for (const file of files) {
    const id = file.slice(0, 2);
    const source = readFileSync(join(dir, file), 'utf8');
    const started = Date.now();
    try {
      const trip = await createTrip(env, source);
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      const failures = check(id, source, trip.plan);
      const days = trip.plan.events.filter((e) => e.type === 'day');
      const summary = `${days.length} days, ${days.flatMap((d) => d.activities).length} activities, ${seconds}s, code ${trip.share_code}`;
      if (failures.length === 0) {
        console.log(`PASS ${file}: ${summary}`);
      } else {
        failed++;
        console.log(`FAIL ${file}: ${summary}\n     - ${failures.join('\n     - ')}`);
      }
    } catch (err) {
      failed++;
      console.log(`FAIL ${file}: ${err.message}`);
    }
  }
  console.log(`\n${files.length - failed}/${files.length} passed`);
  process.exit(failed ? 1 : 0);
}

await main();
