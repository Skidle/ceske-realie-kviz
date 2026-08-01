import React, { Fragment } from 'react';
import { nanoid } from 'nanoid';
import { rawMarkup } from './helpers';
import InstantFeedback from './InstantFeedback';

// correctAnswer is a 1-based index held as a string, e.g. "3".
const isCorrectAnswer = (index, correctAnswer) => index === Number(correctAnswer);

const AnswerContent = ({ answer, questionType }) => (
  <>
    {questionType === 'text' && <span>{answer}</span>}
    {questionType === 'photo' && <img src={answer} alt="answer" />}
  </>
);

function QuestionView({
  question,
  questionNumber,
  questionCount,
  appLocale,
  showInstantFeedback,
  isCorrect,
  incorrectAnswer,
  answerButtons,
  showNextQuestionButton,
  onAnswer,
  onNext,
}) {
  const { answers, correctAnswer, questionType } = question;

  return (
    <div className="questionWrapperBody">
      <div>
        {`${appLocale.question} ${questionNumber} / ${questionCount}:`}
        <br />
      </div>
      <h3 dangerouslySetInnerHTML={rawMarkup(question.question)} />
      {question.questionPic && <img src={question.questionPic} alt="question" />}
      <div className="questionModal">
        <InstantFeedback
          showInstantFeedback={showInstantFeedback}
          correctAnswer={isCorrect}
          incorrectAnswer={incorrectAnswer}
        />
      </div>

      {answers.map((answer, index) => {
        const answered = answerButtons[index] !== undefined;

        return (
          <Fragment key={nanoid()}>
            {answered
              ? (
                <button
                  type="button"
                  disabled={answerButtons[index].disabled || false}
                  className={`${answerButtons[index].className} answerBtn btn ${
                    isCorrectAnswer(index + 1, correctAnswer) && showInstantFeedback
                      ? 'correct'
                      : ''
                  }`}
                  onClick={() => onAnswer(index + 1)}
                >
                  <AnswerContent answer={answer} questionType={questionType} />
                </button>
              )
              : (
                <button
                  type="button"
                  onClick={() => onAnswer(index + 1)}
                  className="answerBtn btn "
                >
                  {questionType === 'text' && answer}
                  {questionType === 'photo' && <img src={answer} alt="answer" />}
                </button>
              )}
          </Fragment>
        );
      })}

      {showNextQuestionButton && (
        <div className="questionBtnContainer">
          <button
            onClick={onNext}
            className="nextQuestionBtn primary-button btn"
            type="button"
          >
            {appLocale.nextQuestionBtn}
          </button>
        </div>
      )}
    </div>
  );
}

export default QuestionView;
