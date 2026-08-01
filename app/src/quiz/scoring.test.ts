import { checkAnswer } from './scoring';
import type { AnswerButtons } from './types';
import type { Question } from '../content/types';

// Characterization tests for the answer-checking logic. These assert what the code does
// TODAY, including behaviour that is arguably wrong (see docs/BEHAVIOR.md § Known quirks).
// Phase 1 changes this module; these tests are what prove the change is safe.
//
// Only the single-selection path is covered: every one of the 300 questions is
// single-selection, and the multiple-selection branches are unreachable in this app.

const QUESTION: Question = {
  question: 'A question',
  answers: ['A) one', 'B) two', 'C) three', 'D) four'],
  correctAnswer: '3', // 1-based index, as a string, matching the real data
  category: 0,
  subCategory: 0,
  questionType: 'text',
  answerSelectionType: 'single',
  point: '1',
  questionPic: null,
};

type Config = ReturnType<typeof makeConfig>;

// checkAnswer takes the state it reads and the setters it calls as two separate bags.
// This helper keeps them in one object for brevity, and splits them at the call site.
const makeConfig = (overrides: Partial<{
  userInput: number[];
  currentQuestionIndex: number;
  incorrect: number[];
  correct: number[];
}> = {}) => ({
  userInput: [],
  currentQuestionIndex: 0,
  incorrect: [],
  correct: [],
  setButtons: vi.fn(),
  setIsCorrect: vi.fn(),
  setIncorrectAnswer: vi.fn(),
  setCorrect: vi.fn(),
  setIncorrect: vi.fn(),
  setShowNextQuestionButton: vi.fn(),
  setUserInput: vi.fn(),
  ...overrides,
});

// checkAnswer takes a 1-based answer index.
const answerWith = (index: number, config: Config) => checkAnswer(
  index,
  QUESTION,
  {
    currentQuestionIndex: config.currentQuestionIndex,
    correct: config.correct,
    incorrect: config.incorrect,
    userInput: config.userInput,
  },
  config,
);

// Setters are called with updater functions; resolve one against a starting state.
const resolveUpdater = (setter: Config['setButtons'], prevState: AnswerButtons = {}) => {
  const updater = setter.mock.calls[0][0];
  return typeof updater === 'function' ? updater(prevState) : updater;
};

describe('checkAnswer (single selection)', () => {
  describe('when the answer is correct', () => {
    it('records the question index as correct', () => {
      const config = makeConfig();

      answerWith(3, config);

      expect(config.setCorrect).toHaveBeenCalledWith([0]);
      expect(config.setIncorrect).not.toHaveBeenCalled();
    });

    it('flags correct and clears the incorrect flag', () => {
      const config = makeConfig();

      answerWith(3, config);

      expect(config.setIsCorrect).toHaveBeenCalledWith(true);
      expect(config.setIncorrectAnswer).toHaveBeenCalledWith(false);
    });

    it('reveals the next-question button', () => {
      const config = makeConfig();

      answerWith(3, config);

      expect(config.setShowNextQuestionButton).toHaveBeenCalledWith(true);
    });

    it('records the chosen answer index in userInput', () => {
      const config = makeConfig();

      answerWith(3, config);

      expect(config.setUserInput).toHaveBeenCalledWith([3]);
    });
  });

  describe('when the answer is incorrect', () => {
    it('records the question index as incorrect', () => {
      const config = makeConfig();

      answerWith(1, config);

      expect(config.setIncorrect).toHaveBeenCalledWith([0]);
      expect(config.setCorrect).not.toHaveBeenCalled();
    });

    it('flags incorrect and clears the correct flag', () => {
      const config = makeConfig();

      answerWith(1, config);

      expect(config.setIncorrectAnswer).toHaveBeenCalledWith(true);
      expect(config.setIsCorrect).toHaveBeenCalledWith(false);
    });

    it('still reveals the next-question button', () => {
      const config = makeConfig();

      answerWith(1, config);

      expect(config.setShowNextQuestionButton).toHaveBeenCalledWith(true);
    });
  });

  describe('button states', () => {
    it('disables the answers that were not chosen', () => {
      const config = makeConfig();

      answerWith(3, config);
      const buttons = resolveUpdater(config.setButtons);

      expect(buttons[0]).toEqual({ disabled: true });
      expect(buttons[1]).toEqual({ disabled: true });
      expect(buttons[3]).toEqual({ disabled: true });
    });

    // Quirk: the chosen button's entry is replaced wholesale, so it keeps a className
    // but loses `disabled` — unlike every other answer.
    it('marks the chosen answer correct, without disabling it', () => {
      const config = makeConfig();

      answerWith(3, config);
      const buttons = resolveUpdater(config.setButtons);

      expect(buttons[2]).toEqual({ className: 'correct' });
    });

    it('marks a wrong choice incorrect', () => {
      const config = makeConfig();

      answerWith(1, config);
      const buttons = resolveUpdater(config.setButtons);

      expect(buttons[0]).toEqual({ className: 'incorrect' });
    });
  });

  describe('answering a question that was already answered', () => {
    it('does not record the same question twice', () => {
      const config = makeConfig({ correct: [0] });

      answerWith(3, config);

      expect(config.setCorrect).not.toHaveBeenCalled();
    });

    it('does not move a question from incorrect to correct', () => {
      const config = makeConfig({ incorrect: [0] });

      answerWith(3, config);

      expect(config.setCorrect).not.toHaveBeenCalled();
      expect(config.incorrect).toEqual([0]);
    });

    // Previously this set userInput to an unchanged copy; it now skips the write
    // entirely. Same resulting state either way -- the first answer stands.
    it('keeps the first recorded answer in userInput', () => {
      const config = makeConfig({ userInput: [1] });

      answerWith(3, config);

      expect(config.setUserInput).not.toHaveBeenCalled();
    });
  });

  describe('later questions', () => {
    it('records against the current question index', () => {
      const config = makeConfig({ currentQuestionIndex: 5, userInput: [1, 2, 3, 4, 1] });

      answerWith(3, config);

      expect(config.setCorrect).toHaveBeenCalledWith([5]);
      expect(config.setUserInput).toHaveBeenCalledWith([1, 2, 3, 4, 1, 3]);
    });
  });

  // These assertions were inverted in Phase 1. They previously documented quirk #1 in
  // docs/BEHAVIOR.md: the arrays were mutated in place and state was then set to those
  // same references, which React can skip re-rendering on. checkAnswer is now pure, so
  // the same tests assert the opposite.
  describe('purity', () => {
    it('does not mutate the correct array it was given', () => {
      const correct: number[] = [];
      const config = makeConfig({ correct });

      answerWith(3, config);

      expect(correct).toEqual([]);
    });

    it('calls setCorrect with a new array, not the one it was given', () => {
      const correct: number[] = [];
      const config = makeConfig({ correct });

      answerWith(3, config);

      expect(config.setCorrect).toHaveBeenCalledWith([0]);
      expect(config.setCorrect.mock.calls[0][0]).not.toBe(correct);
    });

    it('does not mutate the incorrect array it was given', () => {
      const incorrect: number[] = [];
      const config = makeConfig({ incorrect });

      answerWith(1, config);

      expect(incorrect).toEqual([]);
      expect(config.setIncorrect).toHaveBeenCalledWith([0]);
      expect(config.setIncorrect.mock.calls[0][0]).not.toBe(incorrect);
    });

    it('does not mutate userInput', () => {
      const userInput: number[] = [];
      const config = makeConfig({ userInput });

      answerWith(3, config);

      expect(userInput).toEqual([]);
    });

    it('preserves earlier entries when recording a later question', () => {
      const correct = [1, 2];
      const config = makeConfig({ correct, currentQuestionIndex: 5 });

      answerWith(3, config);

      expect(config.setCorrect).toHaveBeenCalledWith([1, 2, 5]);
    });
  });
});
