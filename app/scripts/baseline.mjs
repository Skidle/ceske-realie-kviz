// Records the current state of the official source as the baseline the monitor compares
// against. Run deliberately, never on a schedule: regenerating it blesses whatever the
// source happens to be serving today.
//
//   npm run monitor:baseline

import { writeFile } from 'node:fs/promises';
import { findPdfLink, readPdfMetadata } from './lib/source.mjs';
import { describeImage, hotlinkedImageUrls } from './lib/images.mjs';
import { DATA_DIR, writeJson } from './lib/files.mjs';

const fail = (message) => {
  console.error(`\n  ${message}\n`);
  process.exit(2);
};

console.log('Reading the databanka page...');
const link = await findPdfLink();
if (!link.ok) fail(link.reason);

console.log(`  ${link.url}`);
console.log('Reading the PDF...');
const pdf = await readPdfMetadata(link.url);
if (!pdf.ok) fail(pdf.reason);

console.log(`  ${pdf.edition}`);
console.log(`  ${pdf.topicCount} topics`);

await writeJson('source-baseline.json', {
  pdfUrl: link.url,
  edition: pdf.edition,
  updatedAt: pdf.updatedAt,
  topicCount: pdf.topicCount,
  sha256: pdf.sha256,
  bytes: pdf.bytes,
});

const urls = hotlinkedImageUrls();
console.log(`\nReading ${urls.length} hotlinked images...`);

const images = {};
const failures = [];

for (const url of urls) {
  const result = await describeImage(url);
  if (result.ok) {
    images[url] = result.record;
  } else {
    failures.push(`${url} - ${result.reason}`);
  }
  process.stdout.write('.');
}

console.log('');
await writeJson('image-baseline.json', images);

console.log(`\nWrote baselines to ${DATA_DIR}`);
console.log(`  ${Object.keys(images).length} images recorded`);

if (failures.length) {
  console.error(`  ${failures.length} could not be read:`);
  failures.forEach((line) => console.error(`    ${line}`));
  await writeFile(new URL('../data/baseline-failures.txt', import.meta.url), failures.join('\n'));
  process.exit(2);
}
