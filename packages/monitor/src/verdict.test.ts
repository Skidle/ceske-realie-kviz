import { describe, expect, it } from 'vitest';
import { EXIT, verdict } from './verdict.js';
import type { CheckResult } from './types.js';

const item = (state: CheckResult['state']): CheckResult => ({ name: state, state });

describe('verdict', () => {
  it('is verified when everything was checked and nothing moved', () => {
    expect(verdict([item('unchanged'), item('unchanged')]).exitCode).toBe(EXIT.verified);
  });

  it('is drift when the source changed', () => {
    expect(verdict([item('unchanged'), item('changed')]).exitCode).toBe(EXIT.drift);
  });

  it('is drift when the source removed something', () => {
    expect(verdict([item('missing')]).exitCode).toBe(EXIT.drift);
  });

  it('is unverified when a check failed', () => {
    expect(verdict([item('unchanged'), item('unverified')]).exitCode).toBe(EXIT.unverified);
  });

  // The distinction the whole tool rests on: an unchecked item means the run cannot claim
  // the rest are fine either. Reporting drift would imply everything else was confirmed.
  it('prefers unverified over drift when both are present', () => {
    expect(verdict([item('changed'), item('unverified')]).exitCode).toBe(EXIT.unverified);
  });

  it('does not let a known problem count as drift', () => {
    const result = verdict([item('unchanged'), item('known')]);

    expect(result.exitCode).toBe(EXIT.verified);
    expect(result.summary).toContain('1 known bad');
  });

  // An empty list means nothing was checked. It must not read as success.
  it('does not report success when there was nothing to check', () => {
    expect(verdict([]).exitCode).not.toBe(EXIT.drift);
    expect(verdict([]).counts.unchanged).toBe(0);
  });

  it('counts each state for the report', () => {
    const result = verdict([item('unchanged'), item('unchanged'), item('changed')]);
    expect(result.counts).toMatchObject({ unchanged: 2, changed: 1 });
  });
});
