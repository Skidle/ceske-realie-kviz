import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { ImageRecord, SourceRecord } from './types.ts';

export interface Baseline {
  source: SourceRecord;
  /** Keyed by image URL. `knownBad` marks an image we already know is wrong. */
  images: Record<string, ImageRecord>;
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

  if (!parsed.source?.pdfUrl || !parsed.images) {
    throw new Error('baseline.json is missing its source or images section');
  }

  return parsed;
}

export async function writeBaseline(baseline: Baseline): Promise<void> {
  await writeFile(FILE, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

export const baselinePath = FILE;
