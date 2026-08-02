import { describe, expect, it } from 'vitest';
import { report } from './report.ts';
import { verdict } from './verdict.ts';
import type { CheckResult } from './types.ts';

const render = (results: CheckResult[]) => report(results, verdict(results));

describe('report', () => {
  it('says nothing changed when nothing did', () => {
    const text = render([{ name: 'pdf link', state: 'unchanged' }]);

    expect(text).toContain('verified, nothing changed');
    expect(text).not.toContain('Problems');
  });

  it('names what changed and why', () => {
    const text = render([
      { name: 'pdf link', state: 'changed', detail: 'bank_260105.pdf -> bank_270301.pdf' },
    ]);

    expect(text).toContain('CHANGED');
    expect(text).toContain('bank_270301.pdf');
  });

  it('separates what could not be checked from what changed', () => {
    const text = render([
      { name: '1alt1.jpg', state: 'unverified', detail: 'timed out' },
      { name: 'edition', state: 'changed', detail: 'osmé -> deváté' },
    ]);

    expect(text).toContain('UNVERIFIED');
    expect(text).toContain('timed out');
    expect(text).toContain('could not verify');
  });

  // The report must not read as "all clear" while known-bad images sit in the set. Their
  // recorded state is already wrong, so unchanged means still wrong.

  it('counts every state so the totals can be checked at a glance', () => {
    const text = render([
      { name: 'a', state: 'unchanged' },
      { name: 'b', state: 'unchanged' },
      { name: 'c', state: 'missing' },
    ]);

    expect(text).toContain('Checked 3');
    expect(text).toContain('2 unchanged');
    expect(text).toContain('1 missing');
  });
});
