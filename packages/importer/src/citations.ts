import { collapse, stripPageNumbers } from './normalise.ts';
import type { AnswerLetter } from './types.ts';

/**
 * One picture, and where it belongs.
 *
 * `letter` is absent when the picture illustrates the question rather than being one of
 * the alternatives — the citation then reads "Testová úloha 8" with no "alternativa".
 */
export interface Citation {
  topicNumber: number;
  questionNumber: number;
  letter?: AnswerLetter;
  /** A Wikimedia Commons file name, or a URL for the few sources that are not Commons. */
  source: string;
  /** The credit as printed. The licence requires it be kept. */
  credit: string;
}

const TOPIC_HEADING = /^\s*(\d{1,2})\.\s+([A-ZÁ-Ž][A-ZÁ-Ž0-9 ,.()-]{3,})\s*$/;

/**
 * "Testová úloha 1, alternativa A", which the layout puts on a line of its own with the
 * credit and the URL on the lines after it. The trailing group is optional because the
 * whole entry occasionally does fit on one line.
 */
const ENTRY_HEAD = /^Testová úloha\s+(\d{1,2})(?:,\s*alternativa\s+([A-D]))?\s*(.*)$/;

/**
 * The layout wraps URLs mid-string, putting spaces inside percent escapes:
 * "File:Sloup _Nejsv %C4%9Bt%C4%9 Bj%" is one file name. Commons names never contain a
 * space — they use underscores — so every space inside a URL was added by the PDF.
 */
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
    // A percent escape the layout broke beyond repair. Keeping the raw name is better
    // than dropping the citation, since it still says which question the picture is for.
    return commons[1];
  }
}

/**
 * Reads the "CITACE OBRAZOVÉHO MATERIÁLU" section at the end of the document.
 *
 * This is the only thing that says which picture belongs to which question. The bank's own
 * image files are named by position — 17alt3.jpg means "topic 17, alternative 3" — so
 * renumbering the questions silently makes every later file mean something else. That is
 * how four answers came to show portraits of presidents instead of a theatre.
 */
export function parseCitations(text: string): Citation[] {
  const start = text.lastIndexOf('CITACE OBRAZOVÉHO MATERIÁLU');
  if (start === -1) return [];

  const citations: Citation[] = [];
  let topicNumber = 0;
  let open: { questionNumber: number; letter?: AnswerLetter } | null = null;
  let body: string[] = [];

  // An entry runs from its "Testová úloha" line to whatever starts the next one, because
  // the credit and the URL sit on the lines below the heading rather than beside it.
  const close = () => {
    if (!open) return;
    const joined = body.join(' ');
    const source = extractSource(joined);
    if (source) {
      citations.push({
        ...open,
        topicNumber,
        source,
        credit: collapse(joined.split('[online]')[0]) || 'no author given',
      });
    }
    open = null;
    body = [];
  };

  for (const line of stripPageNumbers(text.slice(start)).split('\n')) {
    const heading = line.match(TOPIC_HEADING);
    if (heading) {
      close();
      topicNumber = Number(heading[1]);
      continue;
    }

    const entry = collapse(line).match(ENTRY_HEAD);
    if (entry && topicNumber !== 0) {
      close();
      open = {
        questionNumber: Number(entry[1]),
        ...(entry[2] ? { letter: entry[2] as AnswerLetter } : {}),
      };
      body = [entry[3]];
      continue;
    }

    if (open) body.push(line);
  }

  close();
  return citations;
}

/** Turns a Commons file name into a URL that serves the file itself. */
export function commonsFileUrl(fileName: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}
