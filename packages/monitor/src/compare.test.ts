import { describe, expect, it } from 'vitest';
import { compareSource } from './compare.ts';
import type { SourceRecord } from './types.ts';

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
