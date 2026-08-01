import { useState } from 'react';
import { checkAnswer } from './core-components/helpers';
import type {
  AnswerButtons, IndexedQuestion, ResultFilter,
} from '../types';

const toPoints = (point: string): number => parseInt(point, 10) || 0;

/**
 * Holds the state of a quiz in progress: which question is showing, which questions were
 * answered correctly, and what the player picked.
 *
 * Scores are derived rather than stored, so they cannot drift out of sync with `correct`.
 */
export function useQuizState(questions: IndexedQuestion[]) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState<number[]>([]);
  const [incorrect, setIncorrect] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [buttons, setButtons] = useState<AnswerButtons>({});
  const [isCorrect, setIsCorrect] = useState(false);
  const [incorrectAnswer, setIncorrectAnswer] = useState(false);
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false);
  const [endQuiz, setEndQuiz] = useState(false);
  const [filteredValue, setFilteredValue] = useState<ResultFilter>('all');

  const activeQuestion = questions[currentQuestionIndex];
  const totalPoints = questions.reduce((sum, question) => sum + toPoints(question.point), 0);
  const correctPoints = correct.reduce((sum, index) => sum + toPoints(questions[index].point), 0);

  const answerQuestion = (answerIndex: number) => checkAnswer(
    answerIndex,
    activeQuestion,
    {
      currentQuestionIndex, correct, incorrect, userInput,
    },
    {
      setButtons,
      setCorrect,
      setIncorrect,
      setIsCorrect,
      setIncorrectAnswer,
      setShowNextQuestionButton,
      setUserInput,
    },
  );

  const goToNextQuestion = () => {
    setIncorrectAnswer(false);
    setIsCorrect(false);
    setShowNextQuestionButton(false);
    setButtons({});

    if (currentQuestionIndex + 1 === questions.length) {
      setEndQuiz(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const filterResults = (event: { target: { value: string } }) => (
    setFilteredValue(event.target.value as ResultFilter)
  );

  return {
    activeQuestion,
    currentQuestionIndex,
    correct,
    incorrect,
    userInput,
    buttons,
    isCorrect,
    incorrectAnswer,
    showNextQuestionButton,
    endQuiz,
    filteredValue,
    totalPoints,
    correctPoints,
    answerQuestion,
    goToNextQuestion,
    filterResults,
  };
}

export default useQuizState;
