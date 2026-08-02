export const USER_AGENT = 'ceske-realie-kviz-importer (+https://github.com/Skidle/ceske-realie-kviz)';

const RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 30000;
/** Commons asks that automated readers space their requests out. */
const BETWEEN_REQUESTS_MS = 300;

export type Downloaded = { ok: true; bytes: Uint8Array } | { ok: false; reason: string };

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Bytes, or a reason. Never throws, so one bad picture cannot abandon the other 45.
 *
 * A 404 is reported like any other failure here, unlike in the monitor: this runs once by
 * hand and a person reads the output, so "gone" and "could not fetch" lead to the same
 * place — go and look.
 */
export async function download(url: string): Promise<Downloaded> {
  let last = 'unknown error';

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    await sleep(attempt === 0 ? BETWEEN_REQUESTS_MS : RETRY_DELAY_MS * attempt);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
      });

      if (response.ok) return { ok: true, bytes: new Uint8Array(await response.arrayBuffer()) };
      if (response.status === 404) return { ok: false, reason: 'HTTP 404, the file is gone' };

      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
  }

  return { ok: false, reason: last };
}
