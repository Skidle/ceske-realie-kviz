import type {
  CheckResult, ImageFacts, ImageRecord, SourceRecord,
} from './types.ts';

/**
 * Whether the server's validators still match what we recorded. When they do, the body
 * need not be downloaded at all, which is what keeps a run cheap for the source site.
 */
export function factsMatch(current: ImageFacts, baseline: ImageFacts): boolean {
  if (current.etag && baseline.etag) return current.etag === baseline.etag;

  return current.lastModified === baseline.lastModified
    && current.contentLength === baseline.contentLength;
}

/**
 * Verdict for one image once its content hash is known.
 *
 * A re-upload of identical bytes moves Last-Modified without changing anything that
 * matters, so the hash has the final say.
 */
export function compareImage(
  name: string,
  hash: string,
  baseline: ImageRecord | undefined,
): CheckResult {
  if (!baseline) return { name, state: 'unverified', detail: 'no baseline recorded' };

  // An acknowledged image is reported every run, including when its content is identical
  // to what we recorded. The recorded state is itself wrong, so "unchanged" would mean
  // "still wrong" and a clean run would read as though nothing were amiss.
  if (baseline.knownBad) {
    const moved = hash === baseline.sha256 ? '' : ', and has changed again since';
    return { name, state: 'known', detail: `${baseline.knownBad.reason}${moved}` };
  }

  if (hash === baseline.sha256) return { name, state: 'unchanged' };

  return { name, state: 'changed', detail: `content differs from the recorded ${baseline.bytes} bytes` };
}

export function compareSource(
  current: SourceRecord,
  baseline: SourceRecord,
): CheckResult[] {
  const results: CheckResult[] = [];

  results.push(current.pdfUrl === baseline.pdfUrl
    ? { name: 'pdf link', state: 'unchanged' }
    : { name: 'pdf link', state: 'changed', detail: `${baseline.pdfUrl} -> ${current.pdfUrl}` });

  results.push(current.edition === baseline.edition
    ? { name: 'edition', state: 'unchanged' }
    : { name: 'edition', state: 'changed', detail: `${baseline.edition} -> ${current.edition}` });

  results.push(current.topicCount === baseline.topicCount
    ? { name: 'topics', state: 'unchanged' }
    : { name: 'topics', state: 'changed', detail: `${baseline.topicCount} -> ${current.topicCount}` });

  return results;
}
