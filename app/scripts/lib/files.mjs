import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const DATA_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

export async function writeJson(name, value) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(`${DATA_DIR}${name}`, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Returns null when the file is absent or unreadable. The monitor treats that as a
 * failure to verify rather than as "nothing to compare, so everything is fine".
 */
export async function readJson(name) {
  try {
    return JSON.parse(await readFile(`${DATA_DIR}${name}`, 'utf8'));
  } catch {
    return null;
  }
}
