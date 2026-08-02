// Fetches every picture the question bank cites, and writes the credits beside them.
//
//   npm run pictures -w @kviz/importer
//
// Exit codes: 0 everything fetched, 1 something was not. Writing questions.ts is a
// separate step; this one only puts the files on disk.

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { download } from './download.ts';
import { attribution, savePictures } from './pictures.ts';
import { readSource } from './source.ts';

const IMAGES = fileURLToPath(new URL('../../../app/public/images/questions/', import.meta.url));
const CREDITS = fileURLToPath(new URL('../../../app/public/images/questions/CREDITS.md', import.meta.url));

export async function fetchPictures(): Promise<number> {
  const { citations } = await readSource();
  console.log(`${citations.length} pictures cited\n`);

  await mkdir(IMAGES, { recursive: true });

  const { files, problems } = await savePictures(citations, {
    download,
    write: (name, bytes) => writeFile(new URL(name, `file://${IMAGES.replace(/\\/g, '/')}`), bytes),
    onProgress: (message) => console.log(`  ${message}`),
  });

  await writeFile(CREDITS, attribution(citations, files), 'utf8');

  console.log(`\nWrote ${files.size} pictures and their credits into ${IMAGES}`);

  if (problems.length) {
    console.error(`\n${problems.length} not fetched:`);
    problems.forEach(({ citation, reason }) => {
      console.error(`  topic ${citation.topicNumber} question ${citation.questionNumber}`
        + `${citation.letter ? ` alternative ${citation.letter}` : ''}: ${reason}`);
    });
  }

  return problems.length ? 1 : 0;
}
