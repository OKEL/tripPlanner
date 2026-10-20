// Unit tests for the pure helpers in src/lib. Run with `npm test` (Node's test runner, no build step).
/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractShareCode, normalizeShareCode } from '../src/lib/codes.ts';
import { shortDate, todayISO, tripSummary } from '../src/lib/dates.ts';
import { pickLanguage } from '../src/i18n/detect.ts';
import { LANG_CODES, LANGUAGES } from '../src/i18n/languages.ts';
import { isRtl, routeText } from '../src/lib/rtl.ts';

describe('normalizeShareCode', () => {
  it('uppercases and drops spaces, dashes and look-alike characters', () => {
    assert.equal(normalizeShareCode(' k7q-x3m '), 'K7QX3M');
    assert.equal(normalizeShareCode('O0I1L'), ''); // not in the alphabet
  });
});

const LABELS = ['code', 'קוד'];

describe('extractShareCode', () => {
  const cases: [string, string][] = [
    ["Join my trip 'Israel' on TripPlan. Code: K7QX3M", 'K7QX3M'],
    ["Join my trip 'טיול בישראל – 8 ימים' on TripPlan. Code: K7QX3M", 'K7QX3M'],
    ["Join my trip 'Italy, 5 days' on TripPlan. Code: k7qx3m\n", 'K7QX3M'],
    ["Join my trip 'Code: ABC' on TripPlan. Code: K7QX3M", 'K7QX3M'],
    ['   K7QX3M   ', 'K7QX3M'],
    ['hey here is the trip K7QX3M see you', 'K7QX3M'],
  ];
  for (const [input, want] of cases) {
    it(`finds the code in ${JSON.stringify(input)}`, () => assert.equal(extractShareCode(input, LABELS), want));
  }

  // The Hebrew share message can be joined from an English UI and the reverse: labels come from every language.
  const hebrew: [string, string][] = [
    ["הצטרפו לטיול 'טיול בישראל' ב-TripPlan. קוד: K7QX3M", 'K7QX3M'],
    ["הצטרפו לטיול 'GREECE' ב-TripPlan. קוד: K7QX3M", 'K7QX3M'], // a Latin title word that looks like a code
    ["הצטרפו לטיול 'Code: ABC' ב-TripPlan. קוד: k7qx3m\n", 'K7QX3M'],
    ["Join my trip 'GREECE' on TripPlan. Code: K7QX3M", 'K7QX3M'],
  ];
  for (const [input, want] of hebrew) {
    it(`finds the code in ${JSON.stringify(input)} (all labels)`, () => assert.equal(extractShareCode(input, LABELS), want));
  }
  it('still works with the default label', () => assert.equal(extractShareCode('Code: K7QX3M'), 'K7QX3M'));
  it('the real share messages round-trip', () => {
    for (const code of LANG_CODES) {
      const message = LANGUAGES[code].dict.share.message('GREECE', 'K7QX3M');
      assert.equal(extractShareCode(message, LABELS), 'K7QX3M', message);
    }
  });
});

describe('dates', () => {
  it('todayISO uses the device-local date', () => {
    assert.equal(todayISO(new Date(2026, 9, 14, 23, 59)), '2026-10-14');
  });
  it('shortDate formats ISO dates and rejects anything else', () => {
    assert.equal(shortDate('2026-10-14'), 'Oct 14');
    assert.equal(shortDate('2026-10-14', 'en-US'), 'Oct 14');
    assert.match(shortDate('2026-10-14', 'he-IL') ?? '', /14/); // Hebrew month name (Hermes: verify on the phone)
    assert.equal(shortDate(null), null);
    assert.equal(shortDate('next Tuesday'), null);
  });
  it('tripSummary shows the count, and the range only when days have dates', () => {
    const t = LANGUAGES.en.dict.common.days;
    assert.equal(tripSummary([{ date: null }, { date: null }], 'en-US', t), '2 days');
    assert.equal(tripSummary([{ date: '2026-10-11' }], 'en-US', t), '1 day · Oct 11');
    assert.equal(
      tripSummary([{ date: '2026-10-11' }, { date: null }, { date: '2026-10-18' }], 'en-US', t),
      '3 days · Oct 11 – Oct 18',
    );
    assert.equal(tripSummary([{ date: null }, { date: null }], 'he-IL', LANGUAGES.he.dict.common.days), 'יומיים');
  });
});

describe('isRtl', () => {
  it('follows the first strong character', () => {
    assert.equal(isRtl('טיול בישראל'), true);
    assert.equal(isRtl('09:00 העיר העתיקה'), true); // digits are neutral
    assert.equal(isRtl('Greece – יוון'), false);
    assert.equal(isRtl(null), false);
  });
});

describe('pickLanguage', () => {
  it('picks the first supported device language', () => {
    assert.equal(pickLanguage(['he-IL']), 'he');
    assert.equal(pickLanguage(['fr', 'he']), 'he');
    assert.equal(pickLanguage(['en-GB', 'he']), 'en');
  });
  it('maps the legacy Android code iw to he', () => {
    assert.equal(pickLanguage(['iw']), 'he');
    assert.equal(pickLanguage(['iw_IL']), 'he');
  });
  it('falls back to English', () => {
    assert.equal(pickLanguage(['fr']), 'en');
    assert.equal(pickLanguage([]), 'en');
    assert.equal(pickLanguage([null]), 'en');
    assert.equal(pickLanguage(['', undefined]), 'en');
  });
});

describe('dictionaries', () => {
  it('Hebrew plurals', () => {
    const days = LANGUAGES.he.dict.common.days;
    assert.deepEqual([1, 2, 3, 8].map(days), ['יום אחד', 'יומיים', '3 ימים', '8 ימים']);
  });
  it('every sample has a title in every language', async () => {
    const { SAMPLES } = await import('../src/lib/samples.ts');
    for (const code of LANG_CODES) {
      const titles = LANGUAGES[code].dict.samples.titles;
      assert.deepEqual(SAMPLES.filter((sample) => !titles[sample.id]).map((sample) => sample.id), []);
    }
  });
});

describe('routeText', () => {
  it('points the arrow along the reading direction', () => {
    assert.equal(routeText('Tel Aviv', 'Abu Dhabi'), 'Tel Aviv → Abu Dhabi');
    assert.equal(routeText('תל אביב', 'אבו דאבי'), 'תל אביב ← אבו דאבי');
    assert.equal(routeText('תל אביב', 'Singapore'), 'תל אביב ← Singapore');
  });
  it('handles a missing end', () => {
    assert.equal(routeText('Lisbon', null), 'Lisbon');
    assert.equal(routeText(null, 'Porto'), 'Porto');
    assert.equal(routeText(null, null), '');
  });
});
