# @kviz/importer

Generates `app/src/content/questions.ts` and the question pictures from the official PDF.

```bash
npm run pictures -w @kviz/importer   # fetch cited pictures into app/public/images/questions/
npm run import   -w @kviz/importer   # rebuild questions.ts, validate, print the diff
```

Pictures first: the import checks every picture a question wants is on disk and refuses to
write otherwise. Exit 1 means something needs a person.

## Why

The 2024 data was copied by hand. 15 questions were revised upstream during 2025 and 1
during 2026, four answers were serving portraits of Czech presidents instead of the
National Theatre, and one question was keyed to the wrong answer.

## How a run works

```
OBC_databanka_testovychuloh_260105.pdf
│
├─ 1. extractText(pdf) ......................... unpdf         one long string
│       └─ stripPageNumbers(text) .............. normalise.ts  drop headers and footers
│
├─ 2. parseTopics(text) ........................ parse.ts      → 30 topics
│       │                                                      a real topic has an answer
│       │                                                      key; the contents page does not
│       └─ per topic:
│            ├─ parseQuestions(topic) .......... parse.ts      → 10 questions each
│            │     └─ keyed by letter, never by position
│            └─ parseAnswerKey(topic.body) ..... parse.ts      → { 1: 'C', 2: 'A', … }
│
├─ 3. parseCitations(text) ..................... citations.ts  → 46 credits
│       └─ commonsFileUrl(fileName) ............ citations.ts  → a Commons URL
│
├─ 4. savePictures(citations, deps) ............ pictures.ts   → 44 files
│       ├─ pictureSource(citation) ............. pictures.ts   URL + extension, or a reason
│       ├─ download(url) ....................... download.ts   sequential, named User-Agent
│       └─ attribution(citations, files) ....... pictures.ts   → CREDITS.md
│
├─ 5. buildQuestions(topics, citations, path) .. build.ts      → the app's stored shape
│       ├─ placeTopic(1..30) ................... build.ts      topic → category, 16/7/7
│       ├─ imageFileName(citation) ............. build.ts      → t19-q1-c
│       └─ problems[] .......................... build.ts      refusals, reported not dropped
│
├─ 6. validate(questions, onDisk) .............. emit.ts       blocks the write on failure
├─ 7. diffQuestions(current, built) ............ diff.ts       → added, removed, changed
│       └─ describeDiff(diff) .................. diff.ts
└─ 8. renderQuestions(questions, edition) ...... emit.ts       → questions.ts
```

| File | Takes | Gives back |
|---|---|---|
| `normalise.ts` | raw extracted text | text without page furniture; dates without stray spaces |
| `sections.ts` | text + a marker | everything between one match and the next |
| `parse.ts` | the document, then one topic | topics; questions; answer keys |
| `citations.ts` | the citations section | which picture belongs to which question, and its Commons URL |
| `pictures.ts` | citations | files on disk, credits, and a list of refusals |
| `download.ts` | a URL | bytes or a reason; never throws |
| `build.ts` | topics + citations | questions in the shape the app stores, plus refusals |
| `emit.ts` | questions | validation problems; the generated file |
| `diff.ts` | current + built questions | added, removed, changed, unchanged |

## Four things the PDF does that the parser has to survive

**Alternatives arrive out of order.** Two columns, so the extracted text sometimes runs
`A) … B) … D) … C)`. Reading positionally would swap two answers. Each is keyed by letter.

**Numbers have spaces inside them.** `Datum aktualizace: 1 6. 1 2. 2024` is 16.12.2024.

**The answer key is inconsistently punctuated.** One topic prints `8D 9C` with the comma
missing, so pairs are matched individually rather than split on commas.

**Citations span lines.** The heading, the credit and the URL each get their own line, and
the URL is split again wherever the column ran out. An earlier parser that assumed one
line per entry matched nothing at all while all 12 of its tests passed.

## Validated against

| Edition | Topics | Questions | Answer keys |
|---|---|---|---|
| 2021 | 30 | 300 | 300 |
| 2023 | 30 | 300 | 300 |
| 2026 | 30 | 300 | 300 |

## Matching pictures to questions

The bank names files by position: `17alt3.jpg` is "topic 17, alternative 3". Renumbering
the questions repoints every later file. The PDF's citation section is the only thing that
says what a picture actually is:

```
5. POLITICKÝ SYSTÉM
Testová úloha 1, alternativa A ... <.../wiki/File:Small_coat_of_arms_of_the_Czech_Republic.svg>
Testová úloha 10 ...                                    ← no "alternativa": a question image
```

Files are written as `t{topic}-q{n}-{letter}.{ext}`, so a name cannot come to mean
something else.

Two parsers agree on the 2026 edition independently: the question parser finds 8 questions
whose alternatives are pictures, the citation parser finds 4 citations for each of those 8.

`CORRECTIONS` in `pictures.ts` holds file names the layout broke beyond repair — one entry,
verified against Commons and opened before being added.

Rasters are fetched at `?width=800`; Commons originals total 105MB. Vectors are taken as
they are, since asking for a width rasterises them to PNG.

## Not fetched

| | source | reason |
|---|---|---|
| t12 q2 | `https://pixabay.com/cs/…` | a page, not a Commons file |
| t30 q8 | `Villa_Tugendhat` | no file extension |

Both are text questions, answerable from their wording, so they ship without an
illustration.

## Decided, not done

**Pictures stay black and white**, as the PDF prints them, applied as a CSS filter rather
than baked into the files. Not implemented — they currently render in colour.
