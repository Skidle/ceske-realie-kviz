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

React 18 + TypeScript on Vite, with Tailwind for the landing page and plain CSS for the quiz. Tested with Vitest and Testing Library, routed with react-router.

The quiz under `app/src/lib/` began as an off-the-shelf React quiz template, vendored rather than installed. It has since been cut down to what this app actually uses — roughly 80% of the template was unreachable — and rewritten around a state hook plus two view components.

```
app/src/
  App.tsx                        routes
  Landing.tsx                    landing page
  types.ts                       the data model
  questions.ts                   the questions
  categories.ts                  category / subcategory names
  appLocale.ts                   Czech UI strings
  utils.ts                       shuffling and real-test selection
  lib/
    Quiz.tsx                     setup screen — category, shuffle, real-test toggles
    Core.tsx                     composes the hook and the two views
    useQuizState.ts              quiz state and the actions that change it
    core-components/
      QuestionView.tsx           the question being answered
      ResultsView.tsx            score, filter and reviewed answers
      helpers.ts                 answer checking
```

## Running it

```bash
cd app
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build into app/build
```

CI runs lint, typecheck, tests and build on every push and pull request.

## Keeping the questions current

The official question bank is revised periodically, and this copy is a snapshot. A
scheduled check (`npm run monitor`) watches the source and reports when it moves:

- the PDF link on the official page, whose URL encodes the publication date
- the edition line inside the PDF (`Vydání desáté ... Aktualizováno 5. 1. 2026`)
- that the bank still has 30 topics
- the question images that are still hotlinked to the source

It distinguishes three outcomes — verified, drift, and *could not verify* — so a failed
check never reads as a clean one. It runs monthly via GitHub Actions, opens an issue when
something moves, and commits a heartbeat so a check that stopped happening is visible.

`npm run monitor:baseline` re-records the current state as the new baseline. Run it
deliberately: it blesses whatever the source is serving today.

## Documentation

[`docs/BEHAVIOR.md`](docs/BEHAVIOR.md) describes what the app does today, including known
quirks and every deviation from the official question bank, with reasons and dates.

## Credits

Questions are reproduced from the official public question bank linked above, **copied in September 2024 and not updated since**. This is an unofficial practice tool, not affiliated with or endorsed by them — always check the official source for the current wording of the exam.

One question has been removed since that snapshot because it was retired upstream; see `docs/BEHAVIOR.md` for details.
