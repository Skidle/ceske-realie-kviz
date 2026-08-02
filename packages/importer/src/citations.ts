import { collapse, stripPageNumbers } from './normalise.ts';
import { sections } from './sections.ts';
import type { AnswerLetter } from './types.ts';

/** `letter` is absent for a picture illustrating the question rather than an alternative. */
export interface Citation {
  topicNumber: number;
  questionNumber: number;
  letter?: AnswerLetter;
  /** A Wikimedia Commons file name, or a URL for the few sources that are not Commons. */
  source: string;
  /** The credit as printed. The licence requires it be kept. */
  credit: string;
}

const SECTION_HEADING = 'CITACE OBRAZOVÉHO MATERIÁLU';

const TOPIC_HEADING = /^\s*(\d{1,2})\.\s+([A-ZÁ-Ž][A-ZÁ-Ž0-9 ,.()-]{3,})\s*$/gm;

/** Its own line, credit and URL below it. Trailing group catches an entry that fits on one. */
const ENTRY_HEAD = /^Testová úloha[ \t]+(\d{1,2})(?:,[ \t]*alternativa[ \t]+([A-D]))?[ \t]*(.*)$/gm;

/** Commons names never contain spaces, so every space inside a URL came from the layout. */
const repairUrl = (raw: string) => raw.replace(/\s+/g, '');

function extractSource(entry: string): string | undefined {
  const url = entry.match(/<([^>]+)>/);
  if (!url) return undefined;

  const repaired = repairUrl(url[1]);
  const commons = repaired.match(/\/wiki\/(?:File|Category):(.+?)(?:[?#]|$)/);

  if (!commons) return repaired;

  try {
    return decodeURIComponent(commons[1]);
  } catch {
    // Broken percent escape. Keep the raw name: it still says which question this is for.
    return commons[1];
  }
}

/**
 * The "CITACE OBRAZOVÉHO MATERIÁLU" section: the only thing saying which picture belongs
 * to which question. The bank's own filenames encode position, so renumbering repoints
 * them silently — four answers once showed presidents instead of a theatre.
 */
export function parseCitations(text: string): Citation[] {
  const start = text.lastIndexOf(SECTION_HEADING);
  if (start === -1) return [];

  const body = stripPageNumbers(text.slice(start));

  // An entry runs from its "Testová úloha" line to whatever starts the next. Anything
  // before the first topic heading falls outside every section and is skipped.
  return sections(body, TOPIC_HEADING).flatMap((topic) => sections(topic.body, ENTRY_HEAD)
    .flatMap((entry) => {
      const printed = `${entry.match[3]} ${entry.body}`;
      const source = extractSource(printed);
      if (!source) return [];

      return [{
        topicNumber: Number(topic.match[1]),
        questionNumber: Number(entry.match[1]),
        ...(entry.match[2] ? { letter: entry.match[2] as AnswerLetter } : {}),
        source,
        credit: collapse(printed.split('[online]')[0]) || 'no author given',
      }];
    }));
}

/** Turns a Commons file name into a URL that serves the file itself. */
export function commonsFileUrl(fileName: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}
