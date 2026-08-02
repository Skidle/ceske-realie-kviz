import { describe, expect, it } from 'vitest';
import { describeDiff, diffQuestions } from './diff.ts';
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

describe('diffQuestions', () => {
  it('reports an unchanged question as unchanged', () => {
    expect(diffQuestions([question()], [question()]).unchanged).toBe(1);
  });

  it('reports a question the bank no longer has', () => {
    const diff = diffQuestions([question(), question({ question: 'Stará?' })], [question()]);

    expect(diff.removed.map((q) => q.question)).toEqual(['Stará?']);
  });

  it('reports a question the app does not have yet', () => {
    const diff = diffQuestions([question()], [question(), question({ question: 'Nová?' })]);

    expect(diff.added.map((q) => q.question)).toEqual(['Nová?']);
  });

  it('reports a changed correct answer, with both values', () => {
    const diff = diffQuestions([question()], [question({ correctAnswer: '3' })]);

    expect(diff.changed).toEqual([{
      question: 'Otázka?', what: 'correct answer', before: 'Jedna.', after: 'Tři.',
    }]);
  });

  it('reports reworded alternatives separately from a changed answer', () => {
    const diff = diffQuestions([question()], [question({ answers: ['Jedna.', 'Dvě.', 'Tři.', 'Pět.'] })]);

    expect(diff.changed[0].what).toBe('alternatives');
  });

  it('reports a question that moved topic', () => {
    const diff = diffQuestions([question()], [question({ subCategory: 4 })]);

    expect(diff.changed[0]).toMatchObject({ what: 'topic', before: '0-0', after: '0-4' });
  });

  // An earlier run of this diff reported three changed answers. Two differed only by a
  // stray space and a missing full stop, both introduced by the PDF layout.
  it('ignores punctuation and spacing the layout introduces', () => {
    const before = [question({ answers: ['79 000 km2.', 'b', 'c', 'd'] })];
    const after = [question({ answers: ['79 000 km2 .', 'b', 'c', 'd'] })];

    expect(diffQuestions(before, after).unchanged).toBe(1);
    expect(diffQuestions(before, after).changed).toEqual([]);
  });

  it('ignores a difference in the question text that is only punctuation', () => {
    const diff = diffQuestions([question({ question: 'Kolik je hodin?' })], [question({ question: 'Kolik je hodin ?' })]);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
  });
});

describe('describeDiff', () => {
  it('spells out every changed answer, since those are what mislead someone revising', () => {
    const diff = diffQuestions([question()], [question({ correctAnswer: '2' })]);
    const report = describeDiff(diff);

    expect(report).toContain('Correct answer changed');
    expect(report).toContain('was: Jedna.');
    expect(report).toContain('now: Dvě.');
  });

  it('counts everything', () => {
    const report = describeDiff(diffQuestions([question()], [question(), question({ question: 'Nová?' })]));

    expect(report).toContain('unchanged: 1');
    expect(report).toContain('added:     1');
  });
});
