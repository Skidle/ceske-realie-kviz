// Checks whether the official question bank has changed since we last looked.
//
//   npm run monitor -w @kviz/monitor           compare against baseline.json
//   npm run monitor:record -w @kviz/monitor    record the current state as the baseline
//
// Exit codes: 0 verified, 1 drift, 2 could not verify. See verdict.ts for why 2 outranks 1.
// main.ts is the entry point; this file returns the exit code rather than exiting, so the
// codes themselves can be tested.

import { appendFile } from 'node:fs/promises';
import { readBaseline, writeBaseline, baselinePath } from './baseline.ts';
import { checkSource, readSource } from './check.ts';
import { report } from './report.ts';
import { EXIT, verdict } from './verdict.ts';

async function recordBaseline(): Promise<number> {
  const existing = await readBaseline().catch(() => null);
  if (!existing) {
    console.error(`No baseline at ${baselinePath} to update. The first one must be written by hand.`);
    return EXIT.unverified;
  }

  const source = await readSource();
  if (!source.ok) {
    console.error(`Could not read the source: ${source.reason}`);
    return EXIT.unverified;
  }

  await writeBaseline({ source: source.source, checkedAt: new Date().toISOString() });
  console.log(`Recorded the source into ${baselinePath}`);

  return EXIT.verified;
}

async function check(): Promise<number> {
  let baseline;
  try {
    baseline = await readBaseline();
  } catch (error) {
    console.error(`Could not read the baseline: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT.unverified;
  }

  const results = await checkSource(baseline);
  const outcome = verdict(results);
  const text = report(results, outcome);

  console.log(text);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Monitor\n\n\`\`\`\n${text}\n\`\`\`\n`);
  }

  return outcome.exitCode;
}

export async function runCli(argv: string[]): Promise<number> {
  return argv.includes('--record') ? recordBaseline() : check();
}
