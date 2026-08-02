import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { SourceRecord } from './types.ts';

export interface Baseline {
  source: SourceRecord;
  checkedAt?: string;
}

const FILE = fileURLToPath(new URL('../baseline.json', import.meta.url));

/**
 * Throws rather than returning a default. A missing baseline means nothing can be
 * compared, and the one thing this tool must never do is treat "I could not check" as
 * "nothing changed".
 */
export async function readBaseline(): Promise<Baseline> {
  const raw = await readFile(FILE, 'utf8');
  const parsed = JSON.parse(raw) as Baseline;

  if (!parsed.source?.pdfUrl) {
    throw new Error('baseline.json is missing its source section');
  }

  return parsed;
}

export async function writeBaseline(baseline: Baseline): Promise<void> {
  await writeFile(FILE, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

export const baselinePath = FILE;
