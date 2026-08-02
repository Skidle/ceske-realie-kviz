import { extractText, getDocumentProxy } from 'unpdf';
import { compareSource } from './compare.ts';
import { extractPdfLinks, parseEdition } from './parse.ts';
import { getBytes, getText } from './fetch.ts';
import type { Baseline } from './baseline.ts';
import type { CheckResult, SourceRecord } from './types.ts';

export const DATABANKA_PAGE = 'https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/';

const unverified = (name: string, detail: string): CheckResult => ({ name, state: 'unverified', detail });

/** Reads the current state of the source, or explains why it could not be read. */
export async function readSource(): Promise<
{ ok: true; source: SourceRecord } | { ok: false; reason: string }> {
  const page = await getText(DATABANKA_PAGE);
  if (!page.ok) return { ok: false, reason: 'missing' in page ? 'the databanka page is gone' : page.unverified };

  const links = extractPdfLinks(page.value);
  if (links.length === 0) return { ok: false, reason: 'no question-bank PDF link on the page; its structure may have changed' };
  if (links.length > 1) return { ok: false, reason: `expected one PDF link, found ${links.length}` };

  const file = await getBytes(links[0], 'pdf');
  if (!file.ok) return { ok: false, reason: 'missing' in file ? 'the PDF 404s' : file.unverified };

  let text: string;
  try {
    const pdf = await getDocumentProxy(file.value);
    ({ text } = await extractText(pdf, { mergePages: true }));
  } catch (error) {
    // A PDF that downloads but will not parse is a failure to verify, never a change.
    return { ok: false, reason: `could not extract text: ${error instanceof Error ? error.message : String(error)}` };
  }

  const edition = parseEdition(text);
  if (!edition) return { ok: false, reason: 'no "Vydání ... Aktualizováno" line; the PDF layout may have changed' };

  return { ok: true, source: { pdfUrl: links[0], ...edition } };
}

export async function checkSource(baseline: Baseline): Promise<CheckResult[]> {
  const current = await readSource();
  if (!current.ok) return [unverified('question bank', current.reason)];
  return compareSource(current.source, baseline.source);
}
