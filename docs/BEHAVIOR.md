# Current behaviour

What the app does today. Written before the refactor so changes could be checked against
it, and kept current since. Describes what the code *does*, not what it should do.

## Question data

All 299 questions share one shape: 4 answers, `answerSelectionType: "single"`,
`correctAnswer` a **string** holding a 1-based index (`"3"` = third answer), and
`point: "1"`, also a string. `questionType` is `"text"` (292) or `"photo"` (7), where the
answers are images rather than text. 17 questions carry a `questionPic` shown with the
question itself. No question has an `explanation` field.

Categories are indices into `categories.ts`:

| index | category | questions | subcategories |
|---|---|---|---|
| 0 | Občanský základ | 160 | 16 |
| 1 | Základní geografické informace | 70 | 7 |
| 2 | Základní historické a kulturní informace | 69 | 7 |

## Question selection (`utils.ts`)

`getFinalQuestions({ questions, selectedCategory, selectedSubCategory, shuffle, isRealTest })`
returns the question set, then stamps `questionIndex` 1..n onto it.

- **Real test** (`isRealTest`) takes precedence over every other setting. Picks 16 random
  questions from category 0, 7 from category 1, 7 from category 2 — always 30 — then
  shuffles question order and answer order. The UI disables the category, subcategory,
  and shuffle controls while it is on.
- **Otherwise**, filters by `selectedCategory` then `selectedSubCategory` (empty string
  means no filter), and applies shuffling only if `shuffle` is on.
- **Shuffling** means both question order *and* answer order. When answers are reordered,
  `correctAnswer` is recomputed to keep pointing at the same answer text.

## Scoring (`useQuizState.ts`)

`correct` and `incorrect` hold question indices. Scores are **derived, not stored**:
`totalPoints` sums every question's `point`, and `correctPoints` sums the points of
questions whose index is in `correct`. Since every question is worth 1 point, points
mirror the question counts.

The result screen shows correct-of-total, points, and a filter over the answered questions.

## Answering (`helpers.ts`)

`checkAnswer` compares the clicked 1-based index against `correctAnswer` as strings,
records the question index in `correct` or `incorrect`, disables the other answer buttons,
marks the clicked one, and reveals the next-question button. The first answer to a
question is the one that counts; later clicks on the same question are ignored.

It is pure: it reads the values it needs and hands new arrays to the setters.

## Routing (`App.tsx`)

`/` is the landing page, `/kviz` the quiz, and any other path redirects to `/`. Vercel
serves `index.html` for paths that are not real files, so a hard refresh on `/kviz` works;
static files under `public/` are matched before that rewrite.

## Known quirks

Still present. Documented rather than fixed, to keep refactor commits behaviour-preserving.

1. **The chosen answer button is not disabled.** On answering, every *other* button gets
   `{ disabled: true }`, but the clicked one is replaced by `{ className: 'correct' }`,
   losing `disabled`. It only stops mattering because a repeat answer is ignored.
2. **Answer buttons render a literal `undefined` class.** `class="undefined answerBtn btn"`
   appears on answered questions, because the state for non-selected answers has no
   `className` and that value is interpolated into the class string. Harmless — no
   `.undefined` rule exists.
3. **`alt="answer"` on every answer image** tells a screen-reader user nothing. Note the
   tension: an accurate description would give away the answer to "which picture shows
   Karlštejn". Something like `alt="Možnost 1"` identifies without spoiling.
4. **Image answers are not sized to fit.** Four alternatives do not fit on screen, so
   answering an image question requires scrolling.
5. **`appLocale.resultFilterUnanswered` is unused.** The filter offers only all, correct
   and incorrect.
6. **32 question images are still hotlinked** to the source site. See below — one set is
   already known to serve the wrong pictures.

## Fixed since the baseline

Kept for context, since these shaped the code that exists now.

| Was | Fixed in |
|---|---|
| `checkAnswer` mutated the arrays it was given and called `setState` with the same reference, so React could skip the re-render | Phase 1 — made pure |
| `correctAnswer` had two shapes: a string index, or an array of numbers for multiple-selection | Phase 1 removed multiple-selection as unreachable; Phase 3 types it as a string |
| Unknown URLs, including `/kviz/` with a trailing slash, rendered a blank page | Phase 2 — react-router with a catch-all |
| `alert()` and `window.confirm()` for "Quiz is incomplete" and submit confirmation | Phase 1 — both paths were unreachable and were deleted |
| Roughly 80% of the vendored template was unreachable: timer, progress bar, previous-question button, retry-until-correct, `selectAnswer`, multiple-selection, custom result page, `Explanation` | Phase 1 — deleted |
| Form controls had no associated labels; the icon-only back button had no accessible name | Phase 4 |
| A missing `}` left `.filter-dropdown-select` compiling only as a nested descendant selector, and `height: 12px` on a 16px font made its text overflow | Phase 4 follow-up |
| The result page prefixed questions with English `Q1:`, and `appLocale.question` was the plural `Otázky` | Phase 4 follow-up |
| Answer and result lists were keyed with `nanoid()`, so React destroyed and recreated all four answer buttons on every render. On image questions the pictures were torn out of the DOM and the page jumped to the top | Post-Phase-4 fix |

## Question set changes

Deviations from the September 2024 snapshot of the official question bank, newest first.

### 2026-08-01 — removed "Na kterém obrázku je Český Krumlov, město plné významných památek?"

Category 2 (historical and cultural), subcategory 6. Its four answer images had been
returning 404 from the source site, so the question was unanswerable in production.

Checked against the official bank as republished on 2026-01-05
(`OBC_databanka_testovychuloh_260105.pdf`): the question is gone. The only remaining
mentions of Český Krumlov are a differently-worded UNESCO question, where it appears as
one answer option, and an image credit. The question was retired upstream.

Question count is now 299. Category 2 holds 69 questions; the 16/7/7 real-test split is
unaffected.

Note this is a symptom of a larger issue: the bank is still 300 questions (30 topics x 10),
but individual questions have been replaced since this data was copied. The published
update dates show 15 questions revised during 2025 and 1 during 2026, plus some of the 25
revised during 2024 that postdate the September copy. The dataset needs a proper re-sync
against the current PDF, which is tracked separately.

### 2026-08-01 — self-hosted 9 question images

The images for the Pražský hrad, Karlštejn and Vila Tugendhat questions were 404 at the
source. All three questions still exist in the official bank, so the images were recovered
from the Internet Archive and are now served from `public/images/questions/`.

Captures were date-matched to the September 2024 snapshot this dataset came from. That
matters: the first attempt pulled 2022 captures, and because source filenames encode
question *position* rather than identity, `18alt3.jpg` from 2022 is a photograph of the
Municipal House in Prague rather than Karlštejn. Every recovered image was checked visually
against its question before being committed.

### Known broken: hotlinked images can silently serve the wrong picture

32 images are still hotlinked to the source site. Because filenames encode question
*position* rather than identity, upstream renumbering does not only cause 404s — a URL can
return HTTP 200 with a **different question's image**.

Confirmed case: *"Na kterém obrázku je Národní divadlo v Praze?"* (category 2,
subcategory 6). Its four `17alt*.jpg` answers now serve portraits of Czech presidents, so
no answer is correct. The Internet Archive's last capture, 5 October 2024, still holds the
right images, so the swap happened after that date — most likely at the 5 January 2026
republication of the bank. There is no later capture to narrow it further.

The remaining 31 images have **not** been audited, so the number of affected questions is
unknown rather than one.

This is not fixed by hand. A status-code check cannot detect it; only comparing image
content against a known-good snapshot can. The full audit, standardised filenames and
self-hosting are deferred to the importer and monitor work, which addresses the root cause
rather than the symptoms.
