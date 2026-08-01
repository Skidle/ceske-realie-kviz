import { collapse, normaliseDate, stripPageNumbers } from './normalise.ts';
import { LETTERS } from './types.ts';
import type { AnswerKey, AnswerLetter, ParsedQuestion, Topic } from './types.ts';

/** "12. RODINNÉ PRÁVO" on its own line. Lower case never appears in a heading. */
const TOPIC_HEADING = /^\s*(\d{1,2})\.\s+([A-ZÁ-Ž][A-ZÁ-Ž0-9 ,.()-]{3,})\s*$/gm;

/**
 * The 30 themes.
 *
 * The table of contents repeats every heading, so a match alone does not mean a topic.
 * Only a section that contains an answer key is one; the contents page has dot leaders
 * and a page number instead.
 */
export function parseTopics(text: string): Topic[] {
  const body = stripPageNumbers(text);
  const headings = [...body.matchAll(TOPIC_HEADING)];
  const topics: Topic[] = [];

  headings.forEach((heading, index) => {
    const number = Number(heading[1]);
    const start = heading.index! + heading[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index! : body.length;
    const section = body.slice(start, end);

    // A heading in the table of contents is followed by dots and a page number, not by
    // questions. Only sections that actually contain an answer key are topics.
    if (!section.includes('SPRÁVNÉ ŘEŠENÍ')) return;

    topics.push({ number, title: collapse(heading[2]), body: section });
  });

  return topics;
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

/** Splits a topic's body at "1." … "10." starting a line or following a blank line. */
function splitQuestions(body: string): Array<{ number: number; block: string }> {
  const starts = [...body.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s+(?=[A-ZÁ-Ž(])/g)]
    .filter(([, number]) => Number(number) >= 1 && Number(number) <= 10);

  return starts.map((match, index) => {
    const from = match.index! + match[0].length;
    const to = index + 1 < starts.length ? starts[index + 1].index! : body.length;
    return { number: Number(match[1]), block: body.slice(from, to) };
  });
}

/**
 * Pulls the four alternatives out by their letter.
 *
 * They cannot be read in order: the PDF's two columns mean the extracted text sometimes
 * runs A, B, D, C. Each letter is located, then its text runs to whichever letter marker
 * comes next in the string, whatever that letter happens to be.
 */
function parseAnswers(block: string): { answers: Record<AnswerLetter, string>; isPhoto: boolean } {
  const markers = [...block.matchAll(/(?:^|[\s(])([A-D])\)/g)]
    .map((match) => ({ letter: match[1] as AnswerLetter, at: match.index! + match[0].length }))
    .filter((marker, index, all) => all.findIndex((m) => m.letter === marker.letter) === index);

  const ordered = [...markers].sort((a, b) => a.at - b.at);
  const answers = { A: '', B: '', C: '', D: '' };

  ordered.forEach((marker, index) => {
    const end = index + 1 < ordered.length ? ordered[index + 1].at - 2 : block.length;
    const text = block.slice(marker.at, end);
    // The date line belongs to the question, not to the last alternative.
    answers[marker.letter] = collapse(text.split('Datum aktualizace')[0]);
  });

  return { answers, isPhoto: LETTERS.every((letter) => answers[letter] === '') };
}

export function parseQuestions(topic: Topic): ParsedQuestion[] {
  return splitQuestions(topic.body).map(({ number, block }) => {
    const firstMarker = block.search(/(?:^|[\s(])[A-D]\)/);
    const text = collapse(block.slice(0, firstMarker === -1 ? block.length : firstMarker));
    const date = block.match(/Datum aktualizace testové úlohy:\s*([\d\s.]+)/);
    const { answers, isPhoto } = parseAnswers(block);

    return {
      number,
      text: text.split('Datum aktualizace')[0].trim(),
      answers,
      updatedAt: date ? normaliseDate(date[1]) : undefined,
      isPhoto,
    };
  });
}
