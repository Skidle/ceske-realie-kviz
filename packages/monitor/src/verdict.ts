import type { CheckResult } from './types.ts';

export const EXIT = {
  /** Everything was checked and nothing changed. */
  verified: 0,
  /** The source changed. Someone should look. */
  drift: 1,
  /** The check itself failed. NOT the same as verified. */
  unverified: 2,
} as const;

export type ExitCode = typeof EXIT[keyof typeof EXIT];

export interface Verdict {
  exitCode: ExitCode;
  summary: string;
  counts: Record<CheckResult['state'], number>;
}

/**
 * "Could not verify" outranks "changed" on purpose. If any item was not checked, the run
 * cannot claim the others are fine either — reporting drift would imply the rest were
 * confirmed unchanged, which is exactly the false reassurance this tool exists to avoid.
 */
export function verdict(results: CheckResult[]): Verdict {
  const counts = {
    unchanged: 0, changed: 0, missing: 0, unverified: 0, known: 0,
  };
  results.forEach((result) => { counts[result.state] += 1; });

  if (counts.unverified > 0) {
    return { exitCode: EXIT.unverified, summary: `could not verify ${counts.unverified} item(s)`, counts };
  }

  if (counts.changed + counts.missing > 0) {
    return {
      exitCode: EXIT.drift,
      summary: `${counts.changed} changed, ${counts.missing} missing`,
      counts,
    };
  }

  const known = counts.known ? `, ${counts.known} known bad` : '';
  return { exitCode: EXIT.verified, summary: `verified, nothing changed${known}`, counts };
}
