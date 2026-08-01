// Checks whether the official question bank has changed since we last looked.
//
//   npm run monitor -w @kviz/monitor              compare against baseline.json
//   npm run monitor:baseline -w @kviz/monitor     record the current state as the baseline
//
// Exit codes: 0 verified, 1 drift, 2 could not verify. See verdict.ts for why 2 outranks 1.

import { appendFile } from 'node:fs/promises';
import { readBaseline, writeBaseline, baselinePath } from './baseline.ts';
import { checkImages, checkSource, readSource } from './check.ts';
import { headFacts, getBytes, sha256 } from './fetch.ts';
import { report } from './report.ts';
import { EXIT, verdict } from './verdict.ts';
import type { ImageRecord } from './types.ts';

const recording = process.argv.includes('--record');

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

  const images: Record<string, ImageRecord> = {};
  let failures = 0;

  for (const url of Object.keys(existing.images)) {
    const facts = await headFacts(url);
    const bytes = await getBytes(url, 'jpeg');

    if (!facts.ok || !bytes.ok) {
      failures += 1;
      // Keep what we already knew rather than dropping the entry.
      images[url] = existing.images[url];
      console.error(`  could not read ${url}`);
      continue;
    }

    images[url] = {
      ...facts.value,
      sha256: sha256(bytes.value),
      bytes: bytes.value.length,
      // Acknowledgements are a human decision; a re-record must not silently clear them.
      ...(existing.images[url]?.knownBad ? { knownBad: existing.images[url].knownBad } : {}),
    };
  }

  await writeBaseline({ source: source.source, images, checkedAt: new Date().toISOString() });
  console.log(`Recorded ${Object.keys(images).length} images and the source into ${baselinePath}`);

  return failures ? EXIT.unverified : EXIT.verified;
}

async function check(): Promise<number> {
  let baseline;
  try {
    baseline = await readBaseline();
  } catch (error) {
    console.error(`Could not read the baseline: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT.unverified;
  }

  const results = [...await checkSource(baseline), ...await checkImages(baseline)];
  const outcome = verdict(results);
  const text = report(results, outcome);

  console.log(text);

  // The heartbeat is committed by the workflow, so a check that stopped running is
  // visible in git history rather than being indistinguishable from silence.
  await writeBaseline({ ...baseline, checkedAt: new Date().toISOString() });

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Monitor\n\n\`\`\`\n${text}\n\`\`\`\n`);
  }

  return outcome.exitCode;
}

process.exit(await (recording ? recordBaseline() : check()));
