import { getFinalQuestions } from './utils';
import { questions } from './questions';
import type { Question, QuestionSelection } from './types';

// Characterization tests: these describe what the code does today, so that refactoring
// can be checked against current behaviour. See docs/BEHAVIOR.md.

const defaults: Omit<QuestionSelection, 'questions'> = {
  selectedCategory: '',
  selectedSubCategory: '',
  shuffle: false,
  isRealTest: false,
};

const run = (overrides: Partial<QuestionSelection> = {}) => getFinalQuestions({
  questions, ...defaults, ...overrides,
});

const countByCategory = (qs: Question[]) => qs.reduce<Record<number, number>>((acc, q) => {
  acc[q.category] = (acc[q.category] || 0) + 1;
  return acc;
}, {});

// The correct answer's *text*, which must survive answer shuffling.
const correctText = (q: Question) => q.answers[Number(q.correctAnswer) - 1];

describe('getFinalQuestions', () => {
  describe('with no filters', () => {
    it('returns every question in source order', () => {
      const result = run();

      expect(result).toHaveLength(questions.length);
      expect(result.map((q) => q.question)).toEqual(questions.map((q) => q.question));
    });

    it('stamps questionIndex 1..n', () => {
      const result = run();

      expect(result[0].questionIndex).toBe(1);
      expect(result[questions.length - 1].questionIndex).toBe(questions.length);
    });

    it('does not mutate the source questions', () => {
      const before = JSON.stringify(questions);

      run({ shuffle: true });
      run({ isRealTest: true });

      expect(JSON.stringify(questions)).toBe(before);
    });
  });

  describe('filtering', () => {
    it('filters by category', () => {
      const result = run({ selectedCategory: 1 });

      expect(result).toHaveLength(70);
      expect(result.every((q) => q.category === 1)).toBe(true);
    });

    it('filters by category and subcategory together', () => {
      const result = run({ selectedCategory: 0, selectedSubCategory: 3 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((q) => q.category === 0 && q.subCategory === 3)).toBe(true);
    });

    it('renumbers questionIndex over the filtered set', () => {
      const result = run({ selectedCategory: 2 });

      expect(result.map((q) => q.questionIndex)).toEqual(
        result.map((_, i) => i + 1),
      );
    });
  });

  describe('shuffling', () => {
    // The critical invariant: reordering answers must move correctAnswer with them.
    // If this ever breaks, every shuffled quiz silently marks the wrong answer correct.
    it('keeps correctAnswer pointing at the same answer text', () => {
      const expected = new Map(questions.map((q) => [q.question, correctText(q)]));

      const result = run({ shuffle: true });

      expect(result).toHaveLength(questions.length);
      result.forEach((q) => {
        expect(correctText(q)).toBe(expected.get(q.question));
      });
    });

    it('returns the same set of questions', () => {
      const result = run({ shuffle: true });

      expect(new Set(result.map((q) => q.question)))
        .toEqual(new Set(questions.map((q) => q.question)));
    });

    it('changes the order', () => {
      const result = run({ shuffle: true });

      // Probabilistic, but the chance of the whole bank shuffling back into source
      // order is effectively zero.
      expect(result.map((q) => q.question))
        .not.toEqual(questions.map((q) => q.question));
    });
  });

  describe('real test mode', () => {
    it('returns 30 questions split 16 / 7 / 7 across the three categories', () => {
      const result = run({ isRealTest: true });

      expect(result).toHaveLength(30);
      expect(countByCategory(result)).toEqual({ 0: 16, 1: 7, 2: 7 });
    });

    it('preserves correctAnswer through its shuffling', () => {
      const expected = new Map(questions.map((q) => [q.question, correctText(q)]));

      run({ isRealTest: true }).forEach((q) => {
        expect(correctText(q)).toBe(expected.get(q.question));
      });
    });

    it('picks a different set each time', () => {
      const first = run({ isRealTest: true }).map((q) => q.question);
      const second = run({ isRealTest: true }).map((q) => q.question);

      expect(first).not.toEqual(second);
    });

    it('overrides category, subcategory and shuffle settings', () => {
      const result = run({
        isRealTest: true,
        selectedCategory: 1,
        selectedSubCategory: 2,
        shuffle: false,
      });

      expect(result).toHaveLength(30);
      expect(countByCategory(result)).toEqual({ 0: 16, 1: 7, 2: 7 });
    });

    it('returns no duplicate questions', () => {
      const result = run({ isRealTest: true });

      expect(new Set(result.map((q) => q.question)).size).toBe(30);
    });
  });
});
