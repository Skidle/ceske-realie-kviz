import { createHash } from 'node:crypto';

export const USER_AGENT = 'ceske-realie-kviz-monitor (+https://github.com/Skidle/ceske-realie-kviz)';

const RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 30000;

/** Success, or a definite absence, or an admission that we could not tell. Never a throw. */
export type Fetched<T> =
  | { ok: true; value: T }
  | { ok: false; missing: true }
  | { ok: false; unverified: string };

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

export const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** PDFs start %PDF. A 200 carrying HTML is a redirect to a login page. */
const MAGIC = {
  pdf: [0x25, 0x50, 0x44, 0x46],
};

const looksLike = (kind: keyof typeof MAGIC, bytes: Uint8Array) => MAGIC[kind]
  .every((byte, index) => bytes[index] === byte);

async function request(url: string, method: 'GET'): Promise<Fetched<Response>> {
  let lastError = 'unknown error';

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // 404 is an answer. Anything else may be a hiccup: retry, then admit we could not
      // check rather than claim a change.
      if (response.status === 404) return { ok: false, missing: true };
      if (response.ok) return { ok: true, value: response };

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return { ok: false, unverified: lastError };
}

export async function getBytes(
  url: string,
  expect: keyof typeof MAGIC,
): Promise<Fetched<Uint8Array>> {
  const result = await request(url, 'GET');
  if (!result.ok) return result;

  const bytes = new Uint8Array(await result.value.arrayBuffer());

  if (!looksLike(expect, bytes)) {
    const type = result.value.headers.get('content-type') ?? 'unknown type';
    return { ok: false, unverified: `expected ${expect}, got ${type}` };
  }

  return { ok: true, value: bytes };
}

export async function getText(url: string): Promise<Fetched<string>> {
  const result = await request(url, 'GET');
  if (!result.ok) return result;
  return { ok: true, value: await result.value.text() };
}
