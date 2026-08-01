import { describe, expect, it } from 'vitest';
import { compareImage, compareSource, factsMatch } from './compare.js';
import type { ImageRecord, SourceRecord } from './types.js';

const recorded: ImageRecord = {
  etag: '"23b83-645fc38209b00"',
  lastModified: 'Mon, 15 Dec 2025 11:50:36 GMT',
  contentLength: '146307',
  sha256: 'a'.repeat(64),
  bytes: 146307,
};

describe('factsMatch', () => {
  it('trusts the etag when both sides have one', () => {
    expect(factsMatch({ ...recorded, lastModified: 'whenever' }, recorded)).toBe(true);
  });

  it('reports a different etag as a mismatch', () => {
    expect(factsMatch({ ...recorded, etag: '"other"' }, recorded)).toBe(false);
  });

  it('falls back to date and size when there is no etag', () => {
    const noEtag = { ...recorded, etag: null };
    expect(factsMatch(noEtag, noEtag)).toBe(true);
    expect(factsMatch({ ...noEtag, contentLength: '999' }, noEtag)).toBe(false);
  });
});

describe('compareImage', () => {
  it('passes when the content hash is unchanged', () => {
    expect(compareImage('1alt1.jpg', recorded.sha256, recorded).state).toBe('unchanged');
  });

  it('reports different content as changed', () => {
    expect(compareImage('1alt1.jpg', 'b'.repeat(64), recorded).state).toBe('changed');
  });

  // A known-bad image is still bad, but it is already tracked, so it must not keep the
  // workflow permanently red.
  it('reports an acknowledged image as known rather than as new drift', () => {
    const known: ImageRecord = {
      ...recorded,
      knownBad: { reason: 'shows a president, not the National Theatre', since: '2025-12-15' },
    };
    const result = compareImage('17alt1.jpg', 'b'.repeat(64), known);

    expect(result.state).toBe('known');
    expect(result.detail).toContain('National Theatre');
  });

  // Never "unchanged": with nothing to compare against, the item was not verified.
  it('reports an image with no baseline as unverified', () => {
    expect(compareImage('new.jpg', 'c'.repeat(64), undefined).state).toBe('unverified');
  });
});

describe('compareSource', () => {
  const baseline: SourceRecord = {
    pdfUrl: 'https://example.cz/2026/01/bank_260105.pdf',
    edition: 'Vydání desáté, Praha, 2026 Aktualizováno 5. 1. 2026',
    updatedAt: '5. 1. 2026',
    topicCount: 30,
  };

  it('passes when nothing moved', () => {
    expect(compareSource(baseline, baseline).every((r) => r.state === 'unchanged')).toBe(true);
  });

  it('flags a newly published edition by its link', () => {
    const current = { ...baseline, pdfUrl: 'https://example.cz/2027/03/bank_270301.pdf' };
    const link = compareSource(current, baseline).find((r) => r.name === 'pdf link');

    expect(link?.state).toBe('changed');
    expect(link?.detail).toContain('270301');
  });

  it('flags an edition line that changed under the same link', () => {
    const current = { ...baseline, edition: 'Vydání jedenácté, Praha, 2027 Aktualizováno 1. 3. 2027' };
    expect(compareSource(current, baseline).find((r) => r.name === 'edition')?.state).toBe('changed');
  });

  it('flags a restructured bank', () => {
    const current = { ...baseline, topicCount: 28 };
    expect(compareSource(current, baseline).find((r) => r.name === 'topics')?.state).toBe('changed');
  });
});
