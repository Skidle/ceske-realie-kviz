import { collapse, normaliseDate, stripPageNumbers } from './normalise.ts';
import { sections } from './sections.ts';
import { LETTERS } from './types.ts';
import type { AnswerKey, AnswerLetter, ParsedQuestion, Topic } from './types.ts';

/** "12. RODINNÉ PRÁVO" on its own line. Lower case never appears in a heading. */
const TOPIC_HEADING = /^\s*(\d{1,2})\.\s+([A-ZÁ-Ž][A-ZÁ-Ž0-9 ,.()-]{3,})\s*$/gm;

/** "1." … "10." starting a line, followed by the question itself. */
const QUESTION_NUMBER = /(?:^|\n)\s*(\d{1,2})\.\s+(?=[A-ZÁ-Ž(])/g;

/** "A)", wherever it falls. The alternatives are keyed by this letter, never by position. */
const ANSWER_MARKER = /(?:^|[\s(])([A-D])\)/g;

/** The date line closes a question; whatever follows it belongs to the next one. */
const DATE_LINE = 'Datum aktualizace';

const before = (text: string, marker: string) => text.split(marker)[0];

/**
 * The 30 themes.
 *
 * The table of contents repeats every heading, so a match alone does not mean a topic.
 * Only a section that contains an answer key is one; the contents page has dot leaders
 * and a page number instead.
 */
export function parseTopics(text: string): Topic[] {
  return sections(stripPageNumbers(text), TOPIC_HEADING)
    .filter(({ body }) => body.includes('SPRÁVNÉ ŘEŠENÍ'))
    .map(({ match, body }) => ({
      number: Number(match[1]),
      title: collapse(match[2]),
      body,
    }));
}

/**
 * "SPRÁVNÉ ŘEŠENÍ: 1C, 2C, 3D, 4B, 5A, 6C, 7A, 8B, 9B, 10B"
 *
 * Separators are unreliable — one topic prints "8D 9C" with the comma missing — so the
 * pairs are matched individually rather than by splitting the line.
 */
export function parseAnswerKey(text: string): AnswerKey {
  const line = text.match(/SPRÁVNÉ ŘEŠENÍ\s*:?([^\n]*)/);
  if (!line) return {};

  const key: AnswerKey = {};
  for (const [, number, letter] of line[1].matchAll(/(\d{1,2})\s*([A-D])/g)) {
    key[Number(number)] = letter as AnswerLetter;
  }

  return key;
}

/**
 * Pulls the four alternatives out by their letter.
 *
 * They cannot be read in order: the PDF's two columns mean the extracted text sometimes
 * runs A, B, D, C. Each alternative is keyed by its own letter, and where two markers
 * carry the same letter the first one wins.
 */
function parseAnswers(block: string): { answers: Record<AnswerLetter, string>; isPhoto: boolean } {
  const answers: Record<AnswerLetter, string> = {
    A: '', B: '', C: '', D: '',
  };
  const taken = new Set<AnswerLetter>();

  for (const { match, body } of sections(block, ANSWER_MARKER)) {
    const letter = match[1] as AnswerLetter;
    if (taken.has(letter)) continue;

    taken.add(letter);
    answers[letter] = collapse(before(body, DATE_LINE));
  }

  // A question whose alternatives are pictures prints the markers with nothing after them.
  return { answers, isPhoto: LETTERS.every((letter) => answers[letter] === '') };
}

export function parseQuestions(topic: Topic): ParsedQuestion[] {
  return sections(topic.body, QUESTION_NUMBER)
    .filter(({ match }) => Number(match[1]) >= 1 && Number(match[1]) <= 10)
    .map(({ match, body }) => {
      const firstMarker = body.search(/(?:^|[\s(])[A-D]\)/);
      const asked = body.slice(0, firstMarker === -1 ? body.length : firstMarker);
      const date = body.match(/Datum aktualizace testové úlohy:\s*([\d\s.]+)/);
      const { answers, isPhoto } = parseAnswers(body);

      return {
        number: Number(match[1]),
        text: collapse(before(asked, DATE_LINE)),
        answers,
        updatedAt: date ? normaliseDate(date[1]) : undefined,
        isPhoto,
      };
    });
}
