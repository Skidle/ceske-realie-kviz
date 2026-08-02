import type { CheckResult } from './types.ts';
import type { Verdict } from './verdict.ts';

const NOTEWORTHY: CheckResult['state'][] = ['changed', 'missing', 'unverified'];

/**
 * What a run found, for a person to read.
 */
export function report(results: CheckResult[], verdict: Verdict): string {
  const lines: string[] = [];

  const problems = results.filter((result) => NOTEWORTHY.includes(result.state));
  if (problems.length) {
    lines.push('Problems');
    problems.forEach((result) => {
      lines.push(`  ${result.state.toUpperCase().padEnd(11)} ${result.name}${result.detail ? `  ${result.detail}` : ''}`);
    });
    lines.push('');
  }

  const { counts } = verdict;
  lines.push(`Checked ${results.length}: ${counts.unchanged} unchanged, ${counts.changed} changed, `
    + `${counts.missing} missing, ${counts.unverified} unverified, ${counts.known} known bad`);
  lines.push(`Result: ${verdict.summary}`);

  return lines.join('\n');
}
