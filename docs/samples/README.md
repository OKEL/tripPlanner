# Sample itineraries

Seven itineraries in different formats and languages, used for the extraction quality check ([DESIGN.md 3.5](../DESIGN.md#35-extraction-quality-check)) and as "Load sample" texts in the app. All fictional, except sample 0 (a real tour description with the agency details removed).

After editing a sample, run `node scripts/gen-samples.js` in `mobile/` so the app picks it up.

`node scripts/eval-samples.mjs` (from the repository root) runs every sample through the deployed `create-trip` and does the automatic checks (day count, activity range, dates, no clock time that isn't in the source); names and notes still need a read-through. Invented details must be **0**:
every name, time, and date in the plan must appear in the source.

| # | File | Shows | Days | Activities (expected) | Notable expectations |
|---|------|-------|------|-----------------------|----------------------|
| 0 | `00-indonesia-he.txt` | Long Hebrew tour text extracted from a PDF (about 15,800 characters), dates for every day incl. 2026-10-14. Agency name, contacts and guide name removed; text cleaned of PDF extraction errors | 21 | 45-75 (about 3 per day) | Grouped headings ("Days 1-2", "Days 8-10") expand to one day per date: 2026-10-02..22. Flights → transit events. No clock times in the source, so none in the plan |
| 1 | `01-israel-he.txt` | Hebrew, RTL, dates incl. 2026-10-14 (Today highlight) | 8 | 4+4+4+5+3+3+3+2 = 28 | Day 4 dated 2026-10-14. Day 1 and 8 may produce arrival/departure events. Day 7 "evening free" has `place_query: null` |
| 2 | `02-japan-chatgpt-en.txt` | ChatGPT-style markdown, emoji, bold | 7 | 3-4 per day, ~25 | Train/Shinkansen/Romancecar → transit events (Hakone, Kyoto). No dates (all `null`). Closing "Let me know…" line is not an activity |
| 3 | `03-italy-table-en.txt` | Table format, explicit dates | 5 | 11 rows, 11-14 activities | Days 1-5 = 2026-05-04..08 (Mon-Fri). Row-per-activity; rows of the same day merge into one day. Train Rome→Florence = transit |
| 4 | `04-messy-notes-en.txt` | Sloppy notes, "maybe", "???" | 6 | ~10 | "Drive to Haifa" = transit (drive); "fly back" = departure/transit. Unknown dinner place has `place_query: null`. No invented venue names, no times (except "~2.5h" belongs in notes) |
| 5 | `05-mixed-he-en.txt` | Mixed Hebrew and English, ferry and flight | 4 | ~11 | Language of each name preserved. Ferry = transit |
| 6 | `06-no-times-en.txt` | No times, no days, only city headings | 3 (one per city) | 5+3+4 = 12 | All `time` null. Source has no "Day N": days created per city heading, nothing invented |

Sample 3 activity count depends on how rows are split (a row with a list of three sights may be one or three activities); both are acceptable if nothing is lost.

## Results

Run 2026-10-12 against the deployed `create-trip` (Sonnet 5.5, effort low). "Invented: 0 seen" is a read-through of names, times, and dates only; `notes` fields were not reviewed line by line.

| # | Days found | Activities found | Invented details | Latency (s) | Notes |
|---|-----------|------------------|------------------|-------------|-------|
| 0 | 21 | 51-69 (3 runs: 69, 51, 57) | 0 seen in the date and time checks; names not read through yet | 25-29 | Run 2026-10-13. Days expand per date. Activity count varies between runs, so the range is wide |
| 1 | 8 | 28 (27 + the flight as a transit event on day 8) | 0 seen | 15 | Day 4 = 2026-10-14. Day 8 flight became a `transit` event |
| 2 | 7 | 25 | 0 seen | 13 | No dates. Train legs → transit events, airport arrival/departure created. Closing "Let me know…" ignored |
| 3 | 5 | 14 | 0 seen | 6 | Dates 2026-05-04..08 correct. Rome→Florence train is a transit event with 10:15 |
| 4 | 6 | 9 | 0 seen | 7 | "(name?)" kept in the activity, no venue invented. Day 6 is empty with a flight transit event |
| 5 | 4 | 9 | 0 seen | 6 | Hebrew and English preserved per item |
| 6 | 3 | 12 | 0 seen | 8 | All `time` null, days created per city |

Run 2026-10-12 (night) with `scripts/eval-samples.mjs`: 6/6 passed. Days 8/7/5/6/4/3, activities 26/23/15/12/9/12, latency 5-12 s.
