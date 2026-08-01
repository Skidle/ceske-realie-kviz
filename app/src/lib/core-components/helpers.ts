import snarkdown from 'snarkdown';
import dompurify from 'dompurify';
import type {
  AnswerButtons, CheckAnswerSetters, CheckAnswerState, Question,
} from '../../types';

// Sanitize *after* rendering markdown: snarkdown turns text into HTML, so
// sanitizing first would let markdown re-introduce unsafe markup.
export const rawMarkup = (data: string) => ({ __html: dompurify.sanitize(snarkdown(data)) });

// Every answer is disabled except the one that was clicked, which is left enabled but
// tagged correct/incorrect. Re-answering is ignored, so leaving it enabled is harmless.
const answerButtonStates = (
  answerCount: number,
  answerIndex: number,
  className: string,
): AnswerButtons => {
  const states: AnswerButtons = {};

  for (let i = 0; i < answerCount; i += 1) {
    states[i] = { disabled: true };
  }
  states[answerIndex - 1] = { className };

  return states;
};

const withIndex = (indices: number[], questionIndex: number): number[] => (
  indices.includes(questionIndex) ? indices : [...indices, questionIndex]
);

/**
 * Records the answer to the current question.
 *
 * `answerIndex` is 1-based, matching `question.correctAnswer`, which holds the same
 * 1-based index as a string.
 *
 * Takes the current values it needs and hands new arrays to the setters. It does not
 * mutate anything it is given.
 */
export const checkAnswer = (answerIndex: number, question: Question, {
  currentQuestionIndex,
  correct,
  incorrect,
  userInput,
}: CheckAnswerState, {
  setButtons,
  setCorrect,
  setIncorrect,
  setIsCorrect,
  setIncorrectAnswer,
  setShowNextQuestionButton,
  setUserInput,
}: CheckAnswerSetters) => {
  const isAnswerCorrect = `${answerIndex}` === question.correctAnswer;

  // The first answer given to a question is the one that counts; later clicks on the
  // same question are ignored.
  const alreadyAnswered = correct.includes(currentQuestionIndex)
    || incorrect.includes(currentQuestionIndex);

  if (!alreadyAnswered) {
    if (isAnswerCorrect) {
      setCorrect(withIndex(correct, currentQuestionIndex));
    } else {
      setIncorrect(withIndex(incorrect, currentQuestionIndex));
    }
  }

  if (userInput[currentQuestionIndex] === undefined) {
    const updatedUserInput = [...userInput];
    updatedUserInput[currentQuestionIndex] = answerIndex;
    setUserInput(updatedUserInput);
  }

  setButtons((previous) => ({
    ...previous,
    ...answerButtonStates(
      question.answers.length,
      answerIndex,
      isAnswerCorrect ? 'correct' : 'incorrect',
    ),
  }));
  setIsCorrect(isAnswerCorrect);
  setIncorrectAnswer(!isAnswerCorrect);
  setShowNextQuestionButton(true);
};
