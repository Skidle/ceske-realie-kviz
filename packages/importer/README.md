# @kviz/importer

Regenerates the question data from the official PDF, replacing the 2024 console scrape.

**Nothing writes files yet.** It reads the PDF, builds the questions in memory, and says
how they differ from what the app ships.

## Why

`app/src/content/questions.ts` is a snapshot taken in September 2024. The published
update dates show 15 questions revised during 2025 and 1 during 2026, so the quiz teaches
from a bank that has moved on. Re-doing that by hand is what produced the current data.

## How a run works

Steps 4 and 6 do not exist yet; everything else does.

```
OBC_databanka_testovychuloh_260105.pdf
│
├─ 1. extractText(pdf) ......................... unpdf         one long string
│       └─ stripPageNumbers(text) .............. normalise.ts  drop headers and footers
│
├─ 2. parseTopics(text) ........................ parse.ts      → 30 topics
│       │                                                      skips the table of contents:
│       │                                                      a real topic has an answer key
│       └─ per topic:
│            ├─ parseQuestions(topic) .......... parse.ts      → 10 questions each
│            │     └─ keyed by letter, never by position — the PDF's
│            │        two columns can emit A, B, D, C
│            └─ parseAnswerKey(topic.body) ..... parse.ts      → { 1: 'C', 2: 'A', … }
│
├─ 3. parseCitations(text) ..................... citations.ts  → 46 credits
│       └─ commonsFileUrl(fileName) ............ citations.ts  → a Commons URL
│
├─ 4. fetch each picture ....................... NOT BUILT     → app/public/images/
│
├─ 5. buildQuestions(topics, citations, path) .. build.ts      → the app's stored shape
│       ├─ placeTopic(1..30) ................... build.ts      topic → category 16/7/7
│       ├─ imageFileName(citation) ............. build.ts      → t19-q1-c
│       └─ problems[] .......................... build.ts      anything it would have to
│                                                              guess at, reported not dropped
│
├─ 6. write questions.ts ....................... NOT BUILT
│
└─ 7. diffQuestions(current, built) ............ diff.ts       → what actually changed
        └─ describeDiff(diff) .................. diff.ts       → the text a human reads
```

| File | Takes | Gives back |
|---|---|---|
| `normalise.ts` | raw extracted text | text without page furniture; dates without stray spaces |
| `parse.ts` | the document, then one topic | topics; questions; answer keys |
| `citations.ts` | the citations section | which picture belongs to which question, and its Commons URL |
| `build.ts` | topics + citations | questions in the shape the app stores, plus a list of refusals |
| `diff.ts` | current questions + built ones | added, removed, changed, unchanged |

## What the parser reads

| Function | From | Gives |
|---|---|---|
| `parseTopics` | the whole document | the 30 themes, ignoring the table of contents |
| `parseQuestions` | one topic | question text, four alternatives, update date, whether the alternatives are pictures |
| `parseAnswerKey` | one topic | which letter is correct, per question |
| `normaliseDate` | `1 6. 1 2. 2024` | `16.12.2024` |
| `parseCitations` | the citations section | which picture belongs to which question, and where it came from |

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

## Matching pictures to questions

The bank's own image files are named by position: `17alt3.jpg` means "topic 17,
alternative 3". Renumber the questions and every later file quietly comes to mean
something else, which is how four answers ended up showing portraits of Czech presidents
instead of the National Theatre.

The PDF's citations section is the only thing that says what each picture actually is:

```
5. POLITICKÝ SYSTÉM
Testová úloha 1, alternativa A ... <.../wiki/File:Small_coat_of_arms_of_the_Czech_Republic.svg>
Testová úloha 10 ...                                    ← no "alternativa": a question image
```

Those names resolve through `commons.wikimedia.org/wiki/Special:FilePath/<name>`, so the
pictures can be fetched from Wikimedia Commons under their own stable identities, with the
credit the licence requires.

The two parsers agree on the 2026 edition without being told about each other: the
question parser finds 8 questions whose alternatives are pictures, and the citation parser
finds exactly 4 citations for each of those 8.

## Decided

**Pictures stay black and white**, as the PDF prints them, so practice looks like the
exam. Commons serves the originals in colour, so the greyscale is applied with a CSS
filter rather than baked into the files: the originals stay intact and the choice can be
undone, or offered as a setting, without re-importing anything.

## Where the current data stands

Built from the 2026 edition and diffed against what the app ships today:

| | |
|---|---|
| matched by text | 255 of 300 |
| identical | 245 |
| same answer, reworded alternatives | 3 |
| **different correct answer** | **1** |
| only in the bank | 45 |
| only in the app | 44 |

The one wrong answer the app currently teaches:

```
Paní Nováková má nové zaměstnání… Získala pracovní smlouvu
  app:      3 měsíce
  official: 4 měsíce
```

Questions are matched by their text, so a reworded question reads as one removal and one
addition rather than a change. That overstates the churn, and there is no way around it:
only a person can say whether two differently worded questions are the same question.

The diff compares letters and digits alone. The layout drops full stops and puts spaces
inside numbers, and a stricter comparison claimed three changed answers when only one had
changed — `79 000 km2 .` against `79 000 km2.`, and a missing full stop.

## Still to come

Fetching the pictures from Commons, and emitting `questions.ts`.
