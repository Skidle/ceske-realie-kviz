/** Shapes the quiz works with while it is being played. */

import type { Question } from '../content/types';

/** A question after `getFinalQuestions` has numbered it for display. */
export interface IndexedQuestion extends Question {
  questionIndex: number;
}

/** Which answers a filtered result view is showing. */
export type ResultFilterValue = 'all' | 'correct' | 'incorrect';

/** Per-answer button state while a question is being answered. */
export interface AnswerButtonState {
  disabled?: boolean;
  className?: string;
}

/** Keyed by the 0-based answer index. */
export type AnswerButtons = Record<number, AnswerButtonState>;

/** The values `checkAnswer` reads. */
export interface CheckAnswerState {
  currentQuestionIndex: number;
  correct: number[];
  incorrect: number[];
  userInput: number[];
}

/** The setters `checkAnswer` calls. */
export interface CheckAnswerSetters {
  setButtons: (update: (previous: AnswerButtons) => AnswerButtons) => void;
  setCorrect: (indices: number[]) => void;
  setIncorrect: (indices: number[]) => void;
  setIsCorrect: (value: boolean) => void;
  setIncorrectAnswer: (value: boolean) => void;
  setShowNextQuestionButton: (value: boolean) => void;
  setUserInput: (input: number[]) => void;
}

export interface QuestionSelection {
  questions: Question[];
  selectedCategory: number | '';
  selectedSubCategory: number | '';
  shuffle: boolean;
  isRealTest: boolean;
}
