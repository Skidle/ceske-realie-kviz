// Rebuilds the question data from the official PDF.
//
//   npm run pictures -w @kviz/importer   fetch the pictures the bank cites
//   npm run import   -w @kviz/importer   rebuild questions.ts from the PDF and those files
//
// Exit codes: 0 done, 1 something needs a person. Pictures first: the import checks that
// every picture a question wants is on disk, and refuses to write the file otherwise.
//
// main.ts is the entry point; this returns the exit code rather than exiting, so the codes
// can be tested.

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildQuestions } from './build.ts';
import { describeDiff, diffQuestions } from './diff.ts';
import { download } from './download.ts';
import { imagePathFrom, renderQuestions, validate } from './emit.ts';
import { attribution, savePictures } from './pictures.ts';
import { readSource } from './source.ts';
import type { BuiltQuestion } from './build.ts';

const app = (path: string) => fileURLToPath(new URL(`../../../app/${path}`, import.meta.url));

const IMAGES = app('public/images/questions');
const CREDITS = app('public/images/questions/CREDITS.md');
const QUESTIONS = app('src/content/questions.ts');

export async function fetchPictures(): Promise<number> {
  const { citations } = await readSource();
  console.log(`${citations.length} pictures cited\n`);

  await mkdir(IMAGES, { recursive: true });

  const { files, problems } = await savePictures(citations, {
    download,
    write: (name, bytes) => writeFile(`${IMAGES}/${name}`, bytes),
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

/** What is actually on disk, which is what the questions are allowed to point at. */
async function picturesOnDisk() {
  const files = (await readdir(IMAGES)).filter((file) => !file.endsWith('.md'));

  return {
    files: files.map((file) => ({ name: file.replace(/\.[^.]+$/, ''), file })),
    names: new Set(files),
  };
}

export async function importQuestions(): Promise<number> {
  const { topics, citations, edition } = await readSource();
  const { files, names } = await picturesOnDisk();

  const { questions, problems } = buildQuestions(topics, citations, imagePathFrom(files));

  if (problems.length) {
    console.error(`${problems.length} questions could not be built:`);
    problems.forEach((p) => console.error(`  topic ${p.topicNumber} question ${p.questionNumber}: ${p.reason}`));
    return 1;
  }

  const { problems: invalid } = validate(questions, names);

  if (invalid.length) {
    console.error(`${invalid.length} problems with the built questions:`);
    invalid.forEach((problem) => console.error(`  ${problem}`));
    return 1;
  }

  const { questions: current } = await import('../../../app/src/content/questions.ts') as {
    questions: BuiltQuestion[];
  };

  console.log(describeDiff(diffQuestions(current, questions)));

  await writeFile(QUESTIONS, renderQuestions(questions, edition), 'utf8');
  console.log(`\nWrote ${questions.length} questions into ${QUESTIONS}`);
  console.log('Read the diff before committing: added and removed are a human decision.');

  return 0;
}
