# České reálie — kvíz

[![CI](https://github.com/Skidle/ceske-realie-kviz/actions/workflows/ci.yml/badge.svg)](https://github.com/Skidle/ceske-realie-kviz/actions/workflows/ci.yml)

Practice quiz for the **Czech Realia exam** (*zkouška z českých reálií*), part of applying
for Czech citizenship. Live at
[pruvodceobcanstvim.cz](https://www.pruvodceobcanstvim.cz/) — landing page at `/`, quiz at
`/kviz`.

The [official question bank](https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/) is
published as static material. This turns it into something you can drill.

## What it does

- **300 questions**, generated from the official bank as published 5 January 2026.
- **Three categories**, split into 30 subcategories — one per topic in the bank:

  | category | questions | subcategories |
  |---|---|---|
  | Občanský základ | 160 | 16 |
  | Základní geografické informace | 70 | 7 |
  | Základní historické a kulturní informace | 70 | 7 |

- **Shuffle** — question order and answer order.
- **Real test** — one question from each of the 30 topics, as the exam is built. 16/7/7.
- Instant feedback; results filterable by correct or incorrect.

Client-side only. No backend, no user data.

## Tech

React 18, TypeScript, Vite, Tailwind, react-router. Vitest and Testing Library. npm
workspaces: the app plus two Node packages.

The quiz started as a vendored React quiz template. About 80% of it was unreachable and
has been deleted; what remains is a state hook plus a few view components.

```
app/src/
  main.tsx                 entry
  App.tsx                  routes
  pages/                   LandingPage, QuizPage, SiteLayout
  quiz/
    QuizSetup.tsx          category, subcategory, shuffle, real-test controls
    QuizRunner.tsx         state hook + views
    QuestionCard.tsx       the question being answered
    ResultsPanel.tsx       score, filter, reviewed answers
    ResultFilter.tsx
    AnswerFeedback.tsx
    useQuizState.ts        state and actions
    scoring.ts             answer checking
    selection.ts           filtering, shuffling, real-test selection
    types.ts               shapes used while playing
  content/                 questions.ts, categories.ts, types.ts
  locale/cs.ts             Czech UI strings
  shared/markdown.ts
  styles/tailwind.css
  test/                    setup and fixtures
packages/
  monitor/                 has the official source moved?
  importer/                rebuild the question data from the official PDF
```

Both packages are Node, run with `--experimental-strip-types`, never bundled. Each has its
own README with a step-by-step run map.

## Running it

From the repository root:

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest, every workspace
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # into app/build

npm run monitor  -w @kviz/monitor    # has the official source moved?
npm run pictures -w @kviz/importer   # fetch the pictures the bank cites
npm run import   -w @kviz/importer   # rebuild questions.ts from the PDF
```

CI runs lint, typecheck, tests and build on every push and pull request.

## How this was built

The 2024 version was written by hand. The 2026 rebuild — TypeScript, Vite, tests, CI, and
the two Node packages — was driven with Claude Code, reviewing plans, diffs and docs
rather than typing lines.

It surfaced 12 defects in the original, 5 of them visible to users. Two examples:

- "Real test" drew 30 questions at random rather than one per topic, so it never matched
  how the exam is composed.
- Hotlinked images had started serving a different question's photograph, because the
  source names files by position. Four answers to "which picture shows the National
  Theatre" were portraits of Czech presidents.

Neither surfaces as an error. Both packages exist because of that:
[`monitor`](packages/monitor) reports "could not verify" as its own outcome, never as
"nothing changed"; [`importer`](packages/importer) refuses to emit a question it would
have to guess at.

## Keeping the questions current

The bank is revised periodically. [`packages/monitor`](packages/monitor) checks monthly and
opens an issue when the source moves. Three outcomes — verified, drift, could not verify —
so a failed check never reads as a clean one.

## Documentation

[`docs/BEHAVIOR.md`](docs/BEHAVIOR.md): what the app does today, known quirks, and every
deviation from the official bank with dates.

## Credits

Questions are reproduced from the official public question bank published by the Národní
pedagogický institut ČR, current edition
[OBC_databanka_testovychuloh_260105.pdf](https://cestina-pro-cizince.cz/obcanstvi/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf)
(5 January 2026), from which this copy is generated. Unofficial practice tool, not
affiliated with or endorsed by them — check the official source for current wording.

Pictures come from Wikimedia Commons, credited individually in
[`app/public/images/questions/CREDITS.md`](app/public/images/questions/CREDITS.md) as their
licences require.
