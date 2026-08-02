import type { CheckResult, SourceRecord } from './types.ts';

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
