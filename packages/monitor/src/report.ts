import type { CheckResult } from './types.ts';
import type { Verdict } from './verdict.ts';

const NOTEWORTHY: CheckResult['state'][] = ['changed', 'missing', 'unverified'];

/**
 * Known-bad items are always listed, even though they are not counted as drift. Their
 * recorded state is already wrong, so "unchanged" means "still wrong", and leaving them
 * out would make a clean run read as though everything were fine.
 */
export function report(results: CheckResult[], verdict: Verdict): string {
  const lines: string[] = [];

  const problems = results.filter((result) => NOTEWORTHY.includes(result.state));
  if (problems.length) {
    lines.push('Problems');
    problems.forEach((result) => {
      lines.push(`  ${result.state.toUpperCase().padEnd(11)} ${result.name}${result.detail ? `  ${result.detail}` : ''}`);
      if (result.usedBy) lines.push(`              ${result.usedBy.role} of "${result.usedBy.question}"`);
    });
    lines.push('');
  }

  const known = results.filter((result) => result.state === 'known');
  if (known.length) {
    lines.push(`Known bad, tracked separately (${known.length})`);
    known.forEach((result) => {
      lines.push(`  ${result.name}  ${result.detail ?? ''}`);
      if (result.usedBy) lines.push(`    ${result.usedBy.role} of "${result.usedBy.question}"`);
    });
    lines.push('');
  }

  const { counts } = verdict;
  lines.push(`Checked ${results.length}: ${counts.unchanged} unchanged, ${counts.changed} changed, `
    + `${counts.missing} missing, ${counts.unverified} unverified, ${counts.known} known bad`);
  lines.push(`Result: ${verdict.summary}`);

  return lines.join('\n');
}
