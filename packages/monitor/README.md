# @kviz/monitor

Checks whether the official question bank has changed since we last looked.

The quiz data is a snapshot of a source that keeps moving. Nothing used to notice when it
moved, which is why questions showed 404s for months and four answers showed portraits of
Czech presidents instead of the National Theatre.

**It watches the PDF, not the pictures.** The pictures are files in this repository,
fetched from Wikimedia Commons by `@kviz/importer`, so they cannot change without a commit.
Watching the bank's image URLs was dropped once nothing loaded them: images were found by
scanning the question data for `http`, so the day they became local files that search
returned nothing and every run would have passed having checked no images at all.
`verdict([])` now refuses to call an empty run verified.

## How a run works

```
npm run monitor                                    main.ts → cli.ts
│
├─ 1. readBaseline() ........................... baseline.ts   what we recorded last time
│
├─ 2. checkSource(baseline) .................... check.ts
│       ├─ getText(DATABANKA_PAGE) ............. fetch.ts      GET the page
│       ├─ extractPdfLinks(html) ............... parse.ts      find the one PDF link
│       ├─ getBytes(pdfUrl, 'pdf') ............. fetch.ts      GET the PDF
│       ├─ extractText(pdf) .................... unpdf
│       ├─ parseEdition(text) .................. parse.ts      edition line, topic count
│       └─ compareSource(current, baseline) .... compare.ts    → 3 results
│
├─ 3. verdict(3 results) ....................... verdict.ts    → exit 0, 1 or 2
├─ 4. report(results, verdict) ................. report.ts     → the text printed
└─ 5. exit with the verdict's code
```

Recording a new baseline takes a different path:

```
npm run monitor:record                             main.ts --record
│
├─ readSource() ................................ check.ts      as step 2 above
└─ writeBaseline({ source }) ................... baseline.ts
```

| File | Takes | Gives back |
|---|---|---|
| `fetch.ts` | a URL | bytes, or a reason it failed — never throws |
| `parse.ts` | page HTML, PDF text | the PDF link; the edition line and topic count |
| `compare.ts` | current record + the recorded one | one `CheckResult` per signal |
| `verdict.ts` | all results | an exit code, worst outcome winning |
| `report.ts` | all results | the text a human reads |
| `check.ts` | the baseline | runs step 2 |
| `baseline.ts` | — | reads and writes `baseline.json` |

Functions rather than classes: every step takes data and returns data, so each is testable
without the network.

## Use

```bash
npm run monitor -w @kviz/monitor          # compare against baseline.json
npm run monitor:record -w @kviz/monitor   # record the current state as the new baseline
```

`--record` is deliberate, never scheduled: it blesses whatever the source serves today.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | verified, nothing changed |
| 1 | drift — the source changed |
| 2 | could not verify — the check itself failed |

`2` outranks `1`: if one item could not be checked, the run cannot claim the others are
fine either. A run with no results at all is also `2`.

## What it checks

| Signal | Why |
|---|---|
| PDF link on the databanka page | The URL encodes the publication date. Superseded URLs keep returning 200 forever, so a hardcoded one would look unchanged indefinitely |
| `Vydání ... Aktualizováno` line | Survives trivial re-saves that would change a file hash. Tested against editions from 2021 to 2026 |
| 30 topics | Catches a restructure |

Drift means: re-run `npm run pictures && npm run import` in `@kviz/importer` and read the
diff.

## Cost to the source

One page fetch and one PDF download per run, monthly. Sequential, with a User-Agent naming
the repository. `robots.txt` permits the page fetch.

## baseline.json

```json
{
  "source": { "pdfUrl": "...", "edition": "...", "updatedAt": "...", "topicCount": 30 },
  "checkedAt": "2026-08-01T18:22:00.000Z"
}
```

`checkedAt` records when the baseline was last re-recorded. The monthly check does not
write it: `main` requires pull requests, so the workflow cannot commit. The "last checked"
date lives in the tracking issue instead, and a stale date there is how a check that
stopped running becomes visible.
