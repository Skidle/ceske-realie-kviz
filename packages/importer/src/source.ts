import { extractText, getDocumentProxy } from 'unpdf';
import { download } from './download.ts';
import { parseCitations } from './citations.ts';
import { parseTopics } from './parse.ts';
import type { Citation } from './citations.ts';
import type { Topic } from './types.ts';

/**
 * The edition this import reads.
 *
 * Pinned rather than discovered from the databanka page, so an import is repeatable and a
 * new edition is a deliberate change to this line rather than something that happens on
 * its own. `packages/monitor` is what notices a new one.
 */
export const PDF_URL = 'https://cestina-pro-cizince.cz/obcanstvi/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf';

export interface Source {
  topics: Topic[];
  citations: Citation[];
}

export async function readSource(url = PDF_URL): Promise<Source> {
  const file = await download(url);
  if (!file.ok) throw new Error(`could not download the question bank: ${file.reason}`);

  const { text } = await extractText(await getDocumentProxy(file.bytes), { mergePages: true });

  return { topics: parseTopics(text), citations: parseCitations(text) };
}
