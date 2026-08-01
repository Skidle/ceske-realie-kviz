import snarkdown from 'snarkdown';
import dompurify from 'dompurify';

// Sanitize *after* rendering markdown: snarkdown turns text into HTML, so
// sanitizing first would let markdown re-introduce unsafe markup.
export const rawMarkup = (data) => ({ __html: dompurify.sanitize(snarkdown(data)) });

// `index` is 1-based. `correctAnswer` is that same 1-based index held as a string.
export const checkAnswer = (index, correctAnswer, answerSelectionType, answers, {
  userInput,
  currentQuestionIndex,
  incorrect,
  correct,
  setButtons,
  setIsCorrect,
  setIncorrectAnswer,
  setCorrect,
  setIncorrect,
  setShowNextQuestionButton,
  setUserInput,
}) => {
  const indexStr = `${index}`;
  const disabledAll = Object.keys(answers).map(() => ({ disabled: true }));
  const userInputCopy = [...userInput];

  if (userInputCopy[currentQuestionIndex] === undefined) {
    userInputCopy[currentQuestionIndex] = index;
  }

  if (indexStr === correctAnswer) {
    if (incorrect.indexOf(currentQuestionIndex) < 0 && correct.indexOf(currentQuestionIndex) < 0) {
      correct.push(currentQuestionIndex);
    }

    setButtons((prevState) => ({
      ...prevState,
      ...disabledAll,
      [index - 1]: {
        className: 'correct',
      },
    }));

    setIsCorrect(true);
    setIncorrectAnswer(false);
    setCorrect(correct);
    setShowNextQuestionButton(true);
  } else {
    if (correct.indexOf(currentQuestionIndex) < 0 && incorrect.indexOf(currentQuestionIndex) < 0) {
      incorrect.push(currentQuestionIndex);
    }

    setButtons((prevState) => ({
      ...prevState,
      ...disabledAll,
      [index - 1]: {
        className: 'incorrect',
      },
    }));

    setShowNextQuestionButton(true);
    setIncorrectAnswer(true);
    setIsCorrect(false);
    setIncorrect(incorrect);
  }

  setUserInput(userInputCopy);
};
