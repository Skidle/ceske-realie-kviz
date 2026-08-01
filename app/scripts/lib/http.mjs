// Polite, retrying HTTP helpers shared by the monitor and the baseline generator.
//
// Every function here returns a result object rather than throwing, because the monitor
// has to distinguish "the source changed" from "I could not check", and an exception
// makes that distinction easy to lose.

import { createHash } from 'node:crypto';

export const USER_AGENT = 'ceske-realie-kviz-monitor (+https://github.com/Skidle/ceske-realie-kviz)';

const RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** JPEG files start with FF D8 FF. Guards against a login page served with status 200. */
const looksLikeJpeg = (bytes) => bytes.length > 3
  && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

/** PDF files start with "%PDF-". */
const looksLikePdf = (bytes) => bytes.length > 4
  && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function attempt(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, ...(options.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Requests are made one at a time with a couple of retries. A transient failure resolves
 * to { ok: false, unverified: true } so the caller reports "could not check" rather than
 * mistaking it for either success or drift.
 */
async function request(url, options = {}) {
  let lastError;

  for (let i = 0; i <= RETRIES; i += 1) {
    if (i > 0) await sleep(RETRY_DELAY_MS * i);

    try {
      const response = await attempt(url, options);

      // 404 is a definite answer: the resource is gone. Anything else in the 4xx/5xx
      // range (rate limiting, a gateway hiccup) is worth retrying and, if it persists,
      // is a failure to verify rather than evidence of change.
      if (response.status === 404) return { ok: false, status: 404, missing: true };
      if (response.ok) return { ok: true, status: response.status, response };

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : error.message;
    }
  }

  return { ok: false, unverified: true, reason: lastError };
}

export async function head(url) {
  const result = await request(url, { method: 'HEAD' });
  if (!result.ok) return result;

  const { headers } = result.response;
  return {
    ok: true,
    etag: headers.get('etag'),
    lastModified: headers.get('last-modified'),
    contentLength: headers.get('content-length'),
    contentType: headers.get('content-type'),
  };
}

export async function getBytes(url, { expect } = {}) {
  const result = await request(url);
  if (!result.ok) return result;

  const bytes = new Uint8Array(await result.response.arrayBuffer());
  const contentType = result.response.headers.get('content-type') ?? '';

  // A 200 carrying HTML where an image should be means we were redirected to something
  // like a sign-in page. Hashing that would quietly record the wrong fingerprint.
  if (expect === 'jpeg' && !looksLikeJpeg(bytes)) {
    return { ok: false, unverified: true, reason: `expected JPEG, got ${contentType || 'unknown type'}` };
  }
  if (expect === 'pdf' && !looksLikePdf(bytes)) {
    return { ok: false, unverified: true, reason: `expected PDF, got ${contentType || 'unknown type'}` };
  }

  return { ok: true, bytes, contentType };
}

export async function getText(url) {
  const result = await request(url);
  if (!result.ok) return result;
  return { ok: true, text: await result.response.text() };
}
