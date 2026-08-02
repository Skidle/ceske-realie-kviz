import { describe, expect, it } from 'vitest';
import { imagePathFrom, renderQuestions, validate } from './emit.ts';
import type { BuiltQuestion } from './build.ts';

const question = (over: Partial<BuiltQuestion> = {}): BuiltQuestion => ({
  question: 'Otázka?',
  answers: ['Jedna.', 'Dvě.', 'Tři.', 'Čtyři.'],
  correctAnswer: '1',
  category: 0,
  subCategory: 0,
  questionType: 'text',
  answerSelectionType: 'single',
  point: '1',
  questionPic: null,
  ...over,
});

/** 300 questions: 30 topics of 10, split 16/7/7 across the categories, as the bank is. */
const wholeBank = () => Array.from({ length: 300 }, (_, index) => {
  const topic = Math.floor(index / 10);
  const [category, subCategory] = topic < 16
    ? [0, topic]
    : [topic < 23 ? 1 : 2, topic < 23 ? topic - 16 : topic - 23];

  return question({ question: `Otázka ${index + 1}?`, category, subCategory });
});

describe('renderQuestions', () => {
  const file = renderQuestions([question()], '5. 1. 2026');

  it('is a module the app can import', () => {
    expect(file).toContain("import type { Question } from './types';");
    expect(file).toContain('export const questions: Question[] = [');
  });

  it('says where it came from and how to remake it', () => {
    expect(file).toContain('Edition 5. 1. 2026');
    expect(file).toContain('npm run import');
  });

  it('warns against editing it by hand', () => {
    expect(file).toContain('Do not edit by hand');
  });

  it('writes each question as data, not as code', () => {
    expect(file).toContain('"question": "Otázka?"');
    expect(file).toContain('"correctAnswer": "1"');
  });

  it('ends with a newline, so the file is well formed', () => {
    expect(file.endsWith('];\n')).toBe(true);
  });
});

describe('imagePathFrom', () => {
  const path = imagePathFrom([{ name: 't30-q4-c', file: 't30-q4-c.jpg' }, { name: 't5-q1-a', file: 't5-q1-a.svg' }]);

  it('gives the path the app will request', () => {
    expect(path('t30-q4-c')).toBe('/images/questions/t30-q4-c.jpg');
  });

  // 36 of the pictures are jpg and 8 are svg, so the extension cannot be assumed.
  it('keeps whichever extension the file actually has', () => {
    expect(path('t5-q1-a')).toBe('/images/questions/t5-q1-a.svg');
  });

  it('returns null for a picture that was never fetched', () => {
    expect(path('t30-q8-question')).toBeNull();
  });
});

describe('validate', () => {
  const disk = new Set(['t30-q4-c.jpg']);

  it('passes a healthy bank', () => {
    expect(validate(wholeBank(), disk).problems).toEqual([]);
  });

  it('notices a bank that is not 300 questions', () => {
    expect(validate([question()], disk).problems[0]).toContain('expected 300 questions, built 1');
  });

  it('notices a missing topic', () => {
    const bank = wholeBank().map((q) => ({ ...q, subCategory: 0 }));

    expect(validate(bank, disk).problems).toContainEqual(expect.stringContaining('expected 30 topics'));
  });

  it('notices a question with the wrong number of alternatives', () => {
    const bank = [...wholeBank()];
    bank[0] = question({ answers: ['a', 'b', 'c'] });

    expect(validate(bank, disk).problems).toContainEqual(expect.stringContaining('has 3 alternatives'));
  });

  it('notices an empty alternative', () => {
    const bank = [...wholeBank()];
    bank[0] = question({ answers: ['a', '  ', 'c', 'd'] });

    expect(validate(bank, disk).problems).toContainEqual(expect.stringContaining('empty alternative'));
  });

  // Two identical alternatives make a question unanswerable, whichever is keyed correct.
  it('notices a repeated alternative', () => {
    const bank = [...wholeBank()];
    bank[0] = question({ answers: ['a', 'a', 'c', 'd'] });

    expect(validate(bank, disk).problems).toContainEqual(expect.stringContaining('repeats an alternative'));
  });

  it('notices a correct answer outside the alternatives', () => {
    const bank = [...wholeBank()];
    bank[0] = question({ correctAnswer: '5' });

    expect(validate(bank, disk).problems).toContainEqual(expect.stringContaining('outside 1..4'));
  });

  // The whole point of fetching the pictures: a question must never ask for one that is
  // not there. This is what would have caught the four broken images in the first place.
  it('notices a picture answer that is not on disk', () => {
    const bank = [...wholeBank()];
    bank[0] = question({
      questionType: 'photo',
      answers: ['/images/questions/t30-q4-c.jpg', '/images/questions/missing.jpg', '/i/c.jpg', '/i/d.jpg'],
    });

    const { problems } = validate(bank, disk);

    expect(problems).toContainEqual(expect.stringContaining('missing.jpg, which is not on disk'));
    expect(problems).not.toContainEqual(expect.stringContaining('t30-q4-c.jpg, which is not'));
  });

  it('notices a question illustration that is not on disk', () => {
    const bank = [...wholeBank()];
    bank[0] = question({ questionPic: '/images/questions/gone.jpg' });

    expect(validate(bank, disk).problems).toContainEqual(expect.stringContaining('gone.jpg, which is not on disk'));
  });

  it('does not mind a question with no illustration at all', () => {
    expect(validate(wholeBank(), new Set()).problems).toEqual([]);
  });
});
