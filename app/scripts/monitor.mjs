// Checks whether the official question bank has changed since we last looked.
//
//   npm run monitor
//
// Three outcomes, deliberately kept apart:
//
//   0  verified, nothing changed
//   1  drift: the source changed and we should do something about it
//   2  could not verify: the check itself failed
//
// Collapsing 1 and 2 into a single failure is what turns a monitor into decoration. "The
// bank was republished" is a task; "the site was unreachable" is a broken alarm.

import { findPdfLink, readPdfMetadata } from './lib/source.mjs';
import { checkImage, hotlinkedImageUrls } from './lib/images.mjs';
import { readJson, writeJson } from './lib/files.mjs';

const EXIT = { verified: 0, drift: 1, unverified: 2 };

const findings = { changed: [], missing: [], unverified: [], known: [], unchanged: [] };
const record = (state, summary) => findings[state].push(summary);

const lines = [];
const say = (line = '') => { lines.push(line); console.log(line); };

// --- the PDF ---------------------------------------------------------------

const sourceBaseline = await readJson('source-baseline.json');
const knownDrift = (await readJson('known-drift.json')) ?? { images: {} };

say('Question bank');

if (!sourceBaseline) {
  record('unverified', 'source-baseline.json is missing or unreadable; run "npm run monitor:baseline"');
  say('  baseline   MISSING');
} else {
  const link = await findPdfLink();

  if (!link.ok) {
    record('unverified', link.reason);
    say(`  link       COULD NOT CHECK - ${link.reason}`);
  } else if (link.url !== sourceBaseline.pdfUrl) {
    record('changed', `a new edition was published: ${sourceBaseline.pdfUrl} -> ${link.url}`);
    say('  link       CHANGED');
    say(`               was ${sourceBaseline.pdfUrl}`);
    say(`               now ${link.url}`);
  } else {
    record('unchanged', 'pdf link');
    say(`  link       unchanged  ${link.url.split('/').pop()}`);

    const pdf = await readPdfMetadata(link.url);

    if (!pdf.ok) {
      record('unverified', pdf.reason);
      say(`  edition    COULD NOT CHECK - ${pdf.reason}`);
    } else {
      if (pdf.edition !== sourceBaseline.edition) {
        record('changed', `edition line changed: "${sourceBaseline.edition}" -> "${pdf.edition}"`);
        say('  edition    CHANGED');
        say(`               was ${sourceBaseline.edition}`);
        say(`               now ${pdf.edition}`);
      } else {
        record('unchanged', 'edition');
        say(`  edition    unchanged  ${pdf.edition}`);
      }

      if (pdf.topicCount !== sourceBaseline.topicCount) {
        record('changed', `topic count changed: ${sourceBaseline.topicCount} -> ${pdf.topicCount}`);
        say(`  topics     CHANGED     ${sourceBaseline.topicCount} -> ${pdf.topicCount}`);
      } else {
        record('unchanged', 'topic count');
        say(`  topics     unchanged  ${pdf.topicCount}`);
      }
    }
  }
}

// --- the hotlinked images --------------------------------------------------

const imageBaseline = await readJson('image-baseline.json');
const urls = hotlinkedImageUrls();

say('');
say(`Hotlinked images (${urls.length})`);

if (!imageBaseline) {
  record('unverified', 'image-baseline.json is missing or unreadable; run "npm run monitor:baseline"');
  say('  baseline   MISSING');
} else {
  for (const url of urls) {
    const result = await checkImage(url, imageBaseline[url]);
    const name = url.split('/').pop().split('?')[0];
    const acknowledged = knownDrift.images?.[url];

    if ((result.state === 'changed' || result.state === 'missing') && acknowledged) {
      record('known', `${name} - ${acknowledged.reason}`);
      continue;
    }

    if (result.state === 'unchanged') {
      record('unchanged', name);
    } else {
      record(result.state, `${name} - ${result.detail}`);
      say(`  ${result.state.toUpperCase().padEnd(10)} ${name}  ${result.detail}`);
    }
  }

  const knownBad = Object.keys(knownDrift.images ?? {});
  const counts = [`${findings.unchanged.filter((s) => s.endsWith('.jpg')).length} unchanged`];
  if (knownBad.length) counts.push(`${knownBad.length} known bad`);
  say(`  ${counts.join(', ')}`);
}

// --- verdict ---------------------------------------------------------------

let exitCode = EXIT.verified;
let verdict = 'verified, nothing changed';

if (findings.unverified.length) {
  exitCode = EXIT.unverified;
  verdict = `COULD NOT VERIFY ${findings.unverified.length} item(s)`;
} else if (findings.changed.length || findings.missing.length) {
  exitCode = EXIT.drift;
  verdict = `DRIFT: ${findings.changed.length} changed, ${findings.missing.length} missing`;
}

say('');
say(`Result: ${verdict}`);

// Always listed, even when they match the baseline. These images were already serving the
// wrong content when the baseline was taken, so "unchanged" means "still wrong", and a
// report that omitted them would read as though everything were fine.
const acknowledged = Object.entries(knownDrift.images ?? {});
if (acknowledged.length) {
  say('');
  say(`Known bad, not counted as drift (${acknowledged.length}):`);
  acknowledged.forEach(([url, entry]) => {
    say(`  ${url.split('/').pop().split('?')[0]}  ${entry.reason}`);
  });
  say(`  -> ${acknowledged[0][1].tracked}`);
}

// The heartbeat is committed by the workflow. A stale checkedAt is how we notice that the
// scheduled run itself has stopped happening, which otherwise looks exactly like silence.
await writeJson('last-check.json', {
  checkedAt: new Date().toISOString(),
  result: ['verified', 'drift', 'unverified'][exitCode],
  changed: findings.changed,
  missing: findings.missing,
  unverified: findings.unverified,
  knownDrift: findings.known.length,
});

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Monitor\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`);
}

process.exit(exitCode);
