import { Fragment } from 'react';
import { rawMarkup } from '../shared/markdown';
import AnswerFeedback from './AnswerFeedback';
import type { AnswerButtons, IndexedQuestion } from './types';
import type { AppLocale, QuestionType } from '../content/types';

// correctAnswer is a 1-based index held as a string, e.g. "3".
const isCorrectAnswer = (index: number, correctAnswer: string) => index === Number(correctAnswer);

interface AnswerContentProps {
  answer: string;
  questionType: QuestionType;
}

const AnswerContent = ({ answer, questionType }: AnswerContentProps) => (
  <>
    {questionType === 'text' && <span>{answer}</span>}
    {questionType === 'photo' && <img src={answer} alt="answer" />}
  </>
);

interface QuestionCardProps {
  question: IndexedQuestion;
  questionNumber: number;
  questionCount: number;
  appLocale: AppLocale;
  showInstantFeedback: boolean;
  isCorrect: boolean;
  incorrectAnswer: boolean;
  answerButtons: AnswerButtons;
  showNextQuestionButton: boolean;
  onAnswer: (answerIndex: number) => void;
  onNext: () => void;
}

function QuestionCard({
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
}: QuestionCardProps) {
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
        <AnswerFeedback
          showInstantFeedback={showInstantFeedback}
          correctAnswer={isCorrect}
          incorrectAnswer={incorrectAnswer}
        />
      </div>

      {answers.map((answer, index) => {
        const answered = answerButtons[index] !== undefined;

        return (
          <Fragment key={`${question.questionIndex}-${index}`}>
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

export default QuestionCard;
