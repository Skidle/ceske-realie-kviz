# @kviz/importer

Regenerates the question data from the official PDF, replacing the 2024 console scrape.

**This package currently parses only.** Nothing writes files yet.

## Why

`app/src/content/questions.ts` is a snapshot taken in September 2024. The published
update dates show 15 questions revised during 2025 and 1 during 2026, so the quiz teaches
from a bank that has moved on. Re-doing that by hand is what produced the current data.

## What the parser reads

| Function | From | Gives |
|---|---|---|
| `parseTopics` | the whole document | the 30 themes, ignoring the table of contents |
| `parseQuestions` | one topic | question text, four alternatives, update date, whether the alternatives are pictures |
| `parseAnswerKey` | one topic | which letter is correct, per question |
| `normaliseDate` | `1 6. 1 2. 2024` | `16.12.2024` |

## Three things the PDF does that the parser has to survive

**Alternatives arrive out of order.** The document is laid out in columns, so the
extracted text sometimes runs `A) … B) … D) … C)`. Reading them positionally would
silently swap two answers, which is the worst possible failure for a quiz. Each
alternative is keyed by its own letter.

**Numbers have spaces inside them.** `Datum aktualizace: 1 6. 1 2. 2024` is 16.12.2024.
The layout puts them there; they mean nothing.

**The answer key is not consistently punctuated.** One topic prints `8D 9C` with the comma
missing. The pairs are matched individually rather than by splitting on commas.

## Validated against

Every edition the Internet Archive holds intact:

| Edition | Topics | Questions | Answer keys |
|---|---|---|---|
| 2021 | 30 | 300 | 300 |
| 2023 | 30 | 300 | 300 |
| 2026 | 30 | 300 | 300 |

## Still to come

Mapping the 30 topics onto the app's 3 categories, sourcing images from the Wikimedia
Commons credits, diffing against the current data, and emitting `questions.ts`.
