import { extractText, getDocumentProxy } from 'unpdf';
import { download } from './download.ts';
import { parseCitations } from './citations.ts';
import { collapse } from './normalise.ts';
import { parseTopics } from './parse.ts';
import type { Citation } from './citations.ts';
import type { Topic } from './types.ts';

/**
 * Pinned, not discovered, so an import is repeatable and a new edition is a deliberate
 * change to this line. `packages/monitor` is what notices a new one.
 */
export const PDF_URL = 'https://cestina-pro-cizince.cz/obcanstvi/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf';

export interface Source {
  topics: Topic[];
  citations: Citation[];
  /** The date the PDF prints on its "Vydání ... Aktualizováno" line. */
  edition: string;
}

export async function readSource(url = PDF_URL): Promise<Source> {
  const file = await download(url);
  if (!file.ok) throw new Error(`could not download the question bank: ${file.reason}`);

  const { text } = await extractText(await getDocumentProxy(file.bytes), { mergePages: true });

  const edition = text.match(/Vydání\s+([\d\s.]+)/)?.[1];

  return {
    topics: parseTopics(text),
    citations: parseCitations(text),
    edition: edition ? collapse(edition) : 'unknown',
  };
}
