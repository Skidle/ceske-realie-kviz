# České reálie — kvíz

A practice quiz for the **Czech Realia exam** (*zkouška z českých reálií*), the test you have to pass as part of applying for Czech citizenship.

Live at [pruvodceobcanstvim.cz](https://www.pruvodceobcanstvim.cz/) — landing page at `/`, quiz at `/kviz`.

The [official question bank](https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/) is published as static material, fine for reading but not for drilling. This turns the same 300 questions into something you can practise with.

## What it does

- **All 300 official questions**, from the public question bank as of September 2024.
- **Three categories** matching the exam structure — Občanský základ (160 questions), Základní geografické informace (70), Základní historické a kulturní informace (70) — each split into subcategories, so you can drill one weak topic at a time.
- **Shuffle mode** — randomises question order *and* answer order within a question, so you learn the material rather than the position of the right button.
- **Real test mode** — a 30-question exam with the same category split as the real thing (16 + 7 + 7), drawn at random.
- Instant feedback and a result summary.

Everything runs client-side; no backend, no user data stored.

## Tech

Create React App (React 18) + Tailwind. The quiz component under `app/src/lib/` started as a copy of an off-the-shelf React quiz template and was reworked from there — it's vendored rather than installed, so it can be edited directly.

```
app/src/
  Landing.jsx     landing page
  lib/Quiz.jsx    setup screen — category, subcategory, shuffle, real-test toggles
  lib/Core.jsx    question rendering, answer checking, results
  questions.js    the 300 questions
  categories.js   category / subcategory names
  utils.js        shuffling and real-test question selection
  appLocale.js    Czech UI strings
```

## Running it

```bash
cd app
npm install
npm start        # http://localhost:3000
npm run build    # production build into app/build
```

`app/move-to-quiz-folder.js` is a post-build helper that puts the quiz under `/kviz` and the landing page at the root.

## Credits

Questions are reproduced from the official public question bank linked above, **copied in September 2024 and not updated since**. This is an unofficial practice tool, not affiliated with or endorsed by them — always check the official source for the current wording of the exam.
