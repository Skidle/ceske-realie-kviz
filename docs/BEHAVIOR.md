# Current behaviour

Reference for what the app does as of the Phase 0 baseline. Written before refactoring so
that changes can be checked against it. Describes what the code *does*, not what it should do.

## Question data

All 300 questions share one shape: 4 text answers, `answerSelectionType: "single"`,
`correctAnswer` a **string** holding a 1-based index (`"3"` = third answer), and
`point: "1"` as a **string**. 17 questions carry a `questionPic` URL hotlinked from
`databanka-obcanstvi.cestina-pro-cizince.cz`; `questionType` is `"text"` or `"photo"`.
No question has an `explanation` field.

Categories are indices into `categories.js`:

| index | category | questions | subcategories |
|---|---|---|---|
| 0 | Občanský základ | 160 | 16 |
| 1 | Základní geografické informace | 70 | 7 |
| 2 | Základní historické a kulturní informace | 70 | 7 |

## Question selection (`utils.js`)

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

## Scoring (`Core.jsx`)

`correct` and `incorrect` hold question indices. On finishing, `totalPoints` sums every
question's `point` (parsed from string) and `correctPoints` sums the points of questions
whose index is in `correct`. Since every question is worth 1 point, points currently
mirror the question counts.

The result screen shows correct-of-total, points, and a filter (all / correct / incorrect
/ unanswered) over the answered questions.

## Answering (`helpers.jsx`)

`checkAnswer` is the path this app uses. For single-selection it compares the clicked
1-based index against `correctAnswer` as strings, records the question index in `correct`
or `incorrect`, disables the answer buttons, marks the clicked button correct/incorrect,
and reveals the next-question button.

## Known quirks

Pre-existing; documented deliberately rather than fixed as part of the refactor.

1. **State is set to a mutated array.** `checkAnswer` does `correct.push(i)` on the array
   it was handed, then `setCorrect(correct)` with that same reference. React bails out of
   re-rendering on reference equality, so this update can be dropped. It appears to work
   today only because other state changes in the same handler force the re-render.
   This is the main suspected latent bug.
2. **`correctAnswer` has two shapes.** A string index for single-selection, an array of
   numbers for multiple-selection. All 300 questions are single, so only the string form
   occurs in practice.
3. **Unknown URLs render a blank page.** `App.js` string-compares `window.location.pathname`
   against `/` and `/kviz`. Anything else — including `/kviz/` with a trailing slash —
   matches neither branch and renders nothing.
4. **Most question images are hotlinked** to the source site, so they break if that site
   moves or blocks them. This has already happened once; see Question set changes. The 9
   images belonging to the three affected questions are now served from
   `public/images/questions/`. The remaining 32 are still hotlinked and carry the same risk.
5. **`alert()` / `window.confirm()`** are used for "Quiz is incomplete" and submit
   confirmation. Both are unreachable in this app (see below).
6. **The "unanswered" result filter is unreachable.** `QuizResultFilter` renders only
   three choices — all / correct / incorrect. `appLocale.resultFilterUnanswered` and the
   `unanswered` branch in `Core.jsx` therefore never apply.
7. **`nanoid()` is used as a React `key`** in the answer and result lists, generating a
   fresh key on every render. That defeats reconciliation and remounts the whole list each
   time, instead of updating it.
8. **The chosen answer button is not disabled.** On answering, every *other* button gets
   `{ disabled: true }`, but the clicked one is replaced by `{ className: 'correct' }` —
   losing `disabled`. It only stops responding because a re-answer is ignored elsewhere.

## Reachable surface

`Quiz.jsx` renders `Core` with only three props: `questions`, `appLocale`, and
`showInstantFeedback`. Everything else is `undefined`, which makes large parts of the
vendored template unreachable in this application:

| Feature | Gated on | Status |
|---|---|---|
| Timer, pause screen | `timer` | unreachable |
| Progress bar | `enableProgressBar` | unreachable |
| Previous-question button, submit confirm | `allowNavigation` | unreachable |
| Retry-until-correct | `continueTillCorrect` | unreachable |
| `selectAnswer` path | `revealAnswerOnSubmit` | unreachable |
| Custom result page, `onComplete`, `onQuestionSubmit` | respective props | unreachable |
| Multiple-selection answering | question data | unreachable — all 300 are single |
| `Explanation` component | `question.explanation` | always renders `null` |

Reachable behaviour is: pick a mode, answer single-selection questions one at a time with
instant feedback, then see the result screen with its filter.

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

This is not fixed by hand. A status-code check is not sufficient to detect it; only
comparing image content against a known-good snapshot is. The full audit of the remaining
32 images, standardised filenames, and self-hosting are deferred to the importer and
monitor work, which addresses the root cause rather than the symptoms.
