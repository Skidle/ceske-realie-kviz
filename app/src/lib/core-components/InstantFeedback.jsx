import React, { useEffect } from 'react';
import Explanation from './Explanation';

const renderMessageForCorrectAnswer = (question) => {
  const defaultMessage = 'Máte pravdu. Pro pokračování klikněte na tlačítko «Další»';
  return question.messageForCorrectAnswer || defaultMessage;
};

const renderMessageForIncorrectAnswer = (question) => {
  const defaultMessage = 'Nesprávná odpověď. Zkuste to prosím znovu.';
  return question.messageForIncorrectAnswer || defaultMessage;
};

function InstantFeedback({
  showInstantFeedback, incorrectAnswer, correctAnswer, question, onQuestionSubmit, userAnswer,
}) {
  useEffect(() => {
    if (onQuestionSubmit && (correctAnswer || incorrectAnswer)) {
      onQuestionSubmit({ question, userAnswer, isCorrect: correctAnswer });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctAnswer, incorrectAnswer]);

  return (
    <>
      {incorrectAnswer && showInstantFeedback
            && <div className="alert incorrect">{renderMessageForIncorrectAnswer(question)}</div>}
      {correctAnswer && showInstantFeedback
            && (
            <div className="alert correct">
              {renderMessageForCorrectAnswer(question)}
              <Explanation question={question} isResultPage={false} />
            </div>
            )}
    </>
  );
}

export default InstantFeedback;
