import React, { useState, Fragment } from 'react';
import { nanoid } from 'nanoid';
import QuizResultFilter from './core-components/QuizResultFilter';
import { checkAnswer, rawMarkup } from './core-components/helpers';
import InstantFeedback from './core-components/InstantFeedback';

const toPoints = (point) => parseInt(point, 10) || 0;

// correctAnswer is a 1-based index held as a string, e.g. "3".
const isCorrectAnswer = (index, correctAnswer) => index === Number(correctAnswer);

function Core({ questions, appLocale, showInstantFeedback }) {
  const [incorrectAnswer, setIncorrectAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false);
  const [endQuiz, setEndQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [buttons, setButtons] = useState({});
  const [correct, setCorrect] = useState([]);
  const [incorrect, setIncorrect] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [filteredValue, setFilteredValue] = useState('all');

  const activeQuestion = questions[currentQuestionIndex];
  const totalPoints = questions.reduce((sum, question) => sum + toPoints(question.point), 0);
  const correctPoints = correct.reduce((sum, index) => sum + toPoints(questions[index].point), 0);

  const nextQuestion = (currentQuestionIdx) => {
    setIncorrectAnswer(false);
    setIsCorrect(false);
    setShowNextQuestionButton(false);
    setButtons({});

    if (currentQuestionIdx + 1 === questions.length) {
      setEndQuiz(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIdx + 1);
    }
  };

  const handleChange = (event) => {
    setFilteredValue(event.target.value);
  };

  const renderAnswers = (question, answerButtons) => {
    const {
      answers, correctAnswer, questionType,
    } = question;

    const onClickAnswer = (index) => checkAnswer(index + 1, correctAnswer, 'single', answers, {
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
    });

    return answers.map((answer, index) => (
      <Fragment key={nanoid()}>
        {(answerButtons[index] !== undefined)
          ? (
            <button
              type="button"
              disabled={answerButtons[index].disabled || false}
              className={`${answerButtons[index].className} answerBtn btn ${
                isCorrectAnswer(index + 1, correctAnswer) && showInstantFeedback
                  ? 'correct'
                  : ''
              }`}
              onClick={() => onClickAnswer(index)}
            >
              {questionType === 'text' && <span>{answer}</span>}
              {questionType === 'photo' && <img src={answer} alt="answer" />}
            </button>
          )
          : (
            <button
              type="button"
              onClick={() => onClickAnswer(index)}
              className="answerBtn btn "
            >
              {questionType === 'text' && answer}
              {questionType === 'photo' && <img src={answer} alt="answer" />}
            </button>
          )}
      </Fragment>
    ));
  };

  const renderAnswerInResult = (question, userInputIndex) => {
    const { answers, correctAnswer, questionType } = question;

    return answers.map((answer, index) => {
      let incorrectClassName = `${userInputIndex}` !== correctAnswer
        && `${index + 1}` === `${userInputIndex}` ? 'incorrect' : '';

      if (userInputIndex === undefined && `${index + 1}` !== correctAnswer) {
        incorrectClassName = 'unanswered';
      }

      const correctClassName = `${index + 1}` === correctAnswer ? 'correct' : '';

      return (
        <div key={nanoid()}>
          <button
            type="button"
            disabled
            className={`answerBtn btn ${correctClassName}${incorrectClassName}`}
          >
            {questionType === 'text' && <span>{answer}</span>}
            {questionType === 'photo' && <img src={answer} alt="answer" />}
          </button>
        </div>
      );
    });
  };

  const renderQuizResultQuestions = () => {
    let filteredQuestions;
    let filteredUserInput;

    if (filteredValue !== 'all') {
      const targetQuestions = filteredValue === 'correct' ? correct : incorrect;

      filteredQuestions = questions.filter(
        (_, index) => targetQuestions.indexOf(index) !== -1,
      );
      filteredUserInput = userInput.filter(
        (_, index) => targetQuestions.indexOf(index) !== -1,
      );
    }

    return (filteredQuestions || questions).map((question, index) => {
      const userInputIndex = filteredUserInput
        ? filteredUserInput[index]
        : userInput[index];

      return (
        <div className="result-answer-wrapper" key={nanoid()}>
          <h3
            dangerouslySetInnerHTML={rawMarkup(
              `Q${question.questionIndex}: ${question.question}`,
            )}
          />
          {question.questionPic && (
            <img src={question.questionPic} alt="question" />
          )}
          <div className="result-answer">
            {renderAnswerInResult(question, userInputIndex)}
          </div>
        </div>
      );
    });
  };

  const renderResult = () => (
    <div className="card-body">
      <h2>
        {appLocale.resultPageHeaderText
          .replace('<correctIndexLength>', correct.length)
          .replace('<questionLength>', questions.length)}
      </h2>
      <h2>
        {appLocale.resultPagePoint
          .replace('<correctPoints>', correctPoints)
          .replace('<totalPoints>', totalPoints)}
      </h2>
      <br />
      <QuizResultFilter
        filteredValue={filteredValue}
        handleChange={handleChange}
        appLocale={appLocale}
      />
      {renderQuizResultQuestions()}
    </div>
  );

  return (
    <div className="questionWrapper">
      {!endQuiz && (
        <div className="questionWrapperBody">
          <div>
            {`${appLocale.question} ${currentQuestionIndex + 1} / ${questions.length}:`}
            <br />
          </div>
          <h3 dangerouslySetInnerHTML={rawMarkup(activeQuestion.question)} />
          {activeQuestion.questionPic && (
            <img src={activeQuestion.questionPic} alt="question" />
          )}
          <div className="questionModal">
            <InstantFeedback
              showInstantFeedback={showInstantFeedback}
              correctAnswer={isCorrect}
              incorrectAnswer={incorrectAnswer}
            />
          </div>
          {renderAnswers(activeQuestion, buttons)}
          {showNextQuestionButton && (
            <div className="questionBtnContainer">
              <button
                onClick={() => nextQuestion(currentQuestionIndex)}
                className="nextQuestionBtn primary-button btn"
                type="button"
              >
                {appLocale.nextQuestionBtn}
              </button>
            </div>
          )}
        </div>
      )}
      {endQuiz && renderResult()}
    </div>
  );
}

export default Core;
