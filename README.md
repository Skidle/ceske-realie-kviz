# České reálie — kvíz

[![CI](https://github.com/Skidle/ceske-realie-kviz/actions/workflows/ci.yml/badge.svg)](https://github.com/Skidle/ceske-realie-kviz/actions/workflows/ci.yml)

A practice quiz for the **Czech Realia exam** (*zkouška z českých reálií*), the test you have to pass as part of applying for Czech citizenship.

Live at [pruvodceobcanstvim.cz](https://www.pruvodceobcanstvim.cz/) — landing page at `/`, quiz at `/kviz`.

The [official question bank](https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/) is published as static material, fine for reading but not for drilling. This turns the same questions into something you can practise with.

## What it does

- **299 official questions**, from the public question bank as of September 2024.
- **Three categories** matching the exam structure — Občanský základ (160 questions), Základní geografické informace (70), Základní historické a kulturní informace (69) — each split into subcategories, so you can drill one weak topic at a time.
- **Shuffle mode** — randomises question order *and* answer order within a question, so you learn the material rather than the position of the right button.
- **Real test mode** — a 30-question exam with the same category split as the real thing (16 + 7 + 7), drawn at random.
- Instant feedback and a result summary you can filter by correct or incorrect.

Everything runs client-side; no backend, no user data stored.

## Tech

React 18 + TypeScript on Vite, styled with Tailwind throughout. Tested with Vitest and Testing Library, routed with react-router. An npm workspaces monorepo: the app plus two Node packages that keep its data honest.

The quiz began as an off-the-shelf React quiz template, vendored rather than installed. It has since been cut down to what this app actually uses — roughly 80% of the template was unreachable — and rewritten around a state hook plus a few view components.

```
app/src/
  main.tsx                 entry: mounts the app and loads global styles
  App.tsx                  routes
  pages/
    LandingPage.tsx
    QuizPage.tsx
  quiz/                    everything the quiz is and does
    QuizSetup.tsx          category, subcategory, shuffle and real-test controls
    QuizRunner.tsx         composes the state hook with the two views
    QuestionCard.tsx       the question being answered
    ResultsPanel.tsx       score, filter and reviewed answers
    ResultFilter.tsx
    AnswerFeedback.tsx
    useQuizState.ts        quiz state and the actions that change it
    scoring.ts             answer checking
    selection.ts           filtering, shuffling and real-test selection
    types.ts               shapes used while playing
  content/                 the subject matter
    questions.ts
    categories.ts
    types.ts               shapes as stored
  locale/cs.ts             Czech UI strings
  shared/markdown.ts
  styles/tailwind.css
  test/                    setup and fixtures
packages/
  monitor/                 checks whether the official source has moved
  importer/                rebuilds the question data from the official PDF
```

Both packages are Node, run with `--experimental-strip-types`, and are never bundled into
the app. Each has its own README describing how a run works, step by step.

## Running it

From the repository root — the workspaces take care of themselves:

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest, every workspace
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build into app/build

npm run monitor -w @kviz/monitor   # has the official source moved?
```

CI runs lint, typecheck, tests and build on every push and pull request.

## How this was built

The 2024 version was written by hand. The 2026 rebuild — TypeScript, Vite, tests, CI, and
the two Node packages that keep the data honest — was driven with Claude Code, reviewing
plans, diffs and docs rather than typing lines.

Rebuilding it surfaced 12 defects in the original, 5 of them visible to users. Two worth
naming: "real test" mode drew 30 questions at random rather than one from each of the 30
topics, so it never matched how the exam is actually composed; and the hotlinked question
images had started serving a *different question's* photograph, because the source names
its files by position — four answers to "which picture shows the National Theatre" were
portraits of Czech presidents. Neither surfaces as an error. Both need something to go
looking.

Both packages exist because of that. [`monitor`](packages/monitor) watches the official
source and reports "could not verify" as its own outcome, never as "nothing changed".
[`importer`](packages/importer) rebuilds the data from the official PDF and refuses to
emit a question it would have to guess at.

## Keeping the questions current

The official question bank is revised periodically and this copy is a snapshot.
[`packages/monitor`](packages/monitor) checks monthly whether the source has moved and
opens an issue when it has. It reports three outcomes — verified, drift, and *could not
verify* — so a failed check never reads as a clean one.

## Documentation

[`docs/BEHAVIOR.md`](docs/BEHAVIOR.md) describes what the app does today, including known
quirks and every deviation from the official question bank, with reasons and dates.

## Credits

Questions are reproduced from the official public question bank, published by the Národní
pedagogický institut ČR — current edition:
[OBC_databanka_testovychuloh_260105.pdf](https://cestina-pro-cizince.cz/obcanstvi/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf)
(5 January 2026). **Copied in September 2024 and not updated since.** This is an unofficial practice tool, not affiliated with or endorsed by them — always check the official source for the current wording of the exam.

One question has been removed since that snapshot because it was retired upstream; see `docs/BEHAVIOR.md` for details.
