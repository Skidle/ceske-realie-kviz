import { checkAnswer } from './helpers';

// Characterization tests for the answer-checking logic. These assert what the code does
// TODAY, including behaviour that is arguably wrong (see docs/BEHAVIOR.md § Known quirks).
// Phase 1 changes this module; these tests are what prove the change is safe.
//
// Only the single-selection path is covered: every one of the 300 questions is
// single-selection, and the multiple-selection branches are unreachable in this app.

const ANSWERS = ['A) one', 'B) two', 'C) three', 'D) four'];
const CORRECT_ANSWER = '3'; // 1-based index, as a string, matching the real data

// Builds the config bag checkAnswer expects, with jest.fn() for every setter.
const makeConfig = (overrides = {}) => ({
  userInput: [],
  userAttempt: 1,
  currentQuestionIndex: 0,
  continueTillCorrect: undefined,
  showNextQuestionButton: false,
  incorrect: [],
  correct: [],
  setButtons: jest.fn(),
  setIsCorrect: jest.fn(),
  setIncorrectAnswer: jest.fn(),
  setCorrect: jest.fn(),
  setIncorrect: jest.fn(),
  setShowNextQuestionButton: jest.fn(),
  setUserInput: jest.fn(),
  setUserAttempt: jest.fn(),
  ...overrides,
});

// checkAnswer takes a 1-based answer index.
const answerWith = (index, config) => checkAnswer(index, CORRECT_ANSWER, 'single', ANSWERS, config);

// Setters are called with updater functions; resolve one against a starting state.
const resolveUpdater = (setter, prevState = {}) => {
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

      expect(config.setCorrect).toHaveBeenCalledWith([0]);
    });

    it('does not move a question from incorrect to correct', () => {
      const config = makeConfig({ incorrect: [0] });

      answerWith(3, config);

      expect(config.setCorrect).toHaveBeenCalledWith([]);
      expect(config.incorrect).toEqual([0]);
    });

    it('keeps the first recorded answer in userInput', () => {
      const config = makeConfig({ userInput: [1] });

      answerWith(3, config);

      expect(config.setUserInput).toHaveBeenCalledWith([1]);
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

  // These two document quirk #1 in docs/BEHAVIOR.md: the arrays passed in are mutated,
  // and state is then set to that same reference. React can bail out of re-rendering on
  // reference equality. Phase 1 removes this; these assertions must be updated
  // deliberately at that point, and the Quiz smoke test must keep passing unchanged.
  describe('argument mutation (current behaviour, slated for removal)', () => {
    it('mutates the correct array it was given', () => {
      const correct = [];
      const config = makeConfig({ correct });

      answerWith(3, config);

      expect(correct).toEqual([0]);
    });

    it('calls setCorrect with that same array reference', () => {
      const correct = [];
      const config = makeConfig({ correct });

      answerWith(3, config);

      expect(config.setCorrect.mock.calls[0][0]).toBe(correct);
    });

    it('mutates the incorrect array it was given', () => {
      const incorrect = [];
      const config = makeConfig({ incorrect });

      answerWith(1, config);

      expect(incorrect).toEqual([0]);
      expect(config.setIncorrect.mock.calls[0][0]).toBe(incorrect);
    });

    it('does not mutate userInput, which is copied first', () => {
      const userInput = [];
      const config = makeConfig({ userInput });

      answerWith(3, config);

      expect(userInput).toEqual([]);
    });
  });
});
