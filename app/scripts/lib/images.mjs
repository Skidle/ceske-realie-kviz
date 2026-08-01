// Checks the question images that are still hotlinked to the source site.
//
// Image drift does not reliably follow a PDF republication: 17alt1.jpg reports
// Last-Modified 15 Dec 2025, three weeks before the January 2026 edition. The images sit
// on a different server and move independently, so they are checked separately.

import { getBytes, head, sha256 } from './http.mjs';
import { questions } from '../../src/questions.ts';

/** Every image URL the question data still points at on the source site. */
export function hotlinkedImageUrls() {
  const urls = [];

  for (const question of questions) {
    if (question.questionType === 'photo') urls.push(...question.answers);
    if (question.questionPic) urls.push(question.questionPic);
  }

  return [...new Set(urls.filter((url) => url.startsWith('http')))];
}

/**
 * Cheap check: a HEAD request, comparing the validators the server already provides.
 * The body is downloaded only when that metadata has moved, which keeps a clean run at
 * roughly 40 requests carrying almost nothing.
 */
export async function checkImage(url, baseline) {
  const meta = await head(url);

  if (meta.missing) return { url, state: 'missing', detail: 'HTTP 404' };
  if (!meta.ok) return { url, state: 'unverified', detail: meta.reason };

  const same = baseline
    && (baseline.etag && meta.etag
      ? baseline.etag === meta.etag
      : baseline.lastModified === meta.lastModified
        && baseline.contentLength === meta.contentLength);

  if (same) return { url, state: 'unchanged' };

  // Metadata moved. Confirm with the bytes before calling it a change, since a re-upload
  // of identical content shifts Last-Modified without changing anything that matters.
  const file = await getBytes(url, { expect: 'jpeg' });
  if (file.missing) return { url, state: 'missing', detail: 'HTTP 404' };
  if (!file.ok) return { url, state: 'unverified', detail: file.reason };

  const hash = sha256(file.bytes);
  if (baseline && hash === baseline.sha256) {
    return { url, state: 'unchanged', detail: 're-uploaded, identical content' };
  }

  return {
    url,
    state: 'changed',
    detail: baseline
      ? `${baseline.bytes} bytes -> ${file.bytes.length}, modified ${meta.lastModified ?? 'unknown'}`
      : 'no baseline recorded',
    current: {
      etag: meta.etag,
      lastModified: meta.lastModified,
      contentLength: meta.contentLength,
      sha256: hash,
      bytes: file.bytes.length,
    },
  };
}

/** Full record for the baseline file: metadata plus a content hash. */
export async function describeImage(url) {
  const meta = await head(url);
  if (!meta.ok) return { url, ok: false, reason: meta.reason ?? 'HTTP 404' };

  const file = await getBytes(url, { expect: 'jpeg' });
  if (!file.ok) return { url, ok: false, reason: file.reason ?? 'HTTP 404' };

  return {
    url,
    ok: true,
    record: {
      etag: meta.etag,
      lastModified: meta.lastModified,
      contentLength: meta.contentLength,
      sha256: sha256(file.bytes),
      bytes: file.bytes.length,
    },
  };
}
