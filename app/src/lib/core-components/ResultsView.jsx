import React from 'react';
import { nanoid } from 'nanoid';
import QuizResultFilter from './QuizResultFilter';
import { rawMarkup } from './helpers';

const AnsweredQuestion = ({ question, userInputIndex }) => {
  const { answers, correctAnswer, questionType } = question;

  return answers.map((answer, index) => {
    const answerNumber = `${index + 1}`;

    let incorrectClassName = `${userInputIndex}` !== correctAnswer
      && answerNumber === `${userInputIndex}` ? 'incorrect' : '';

    if (userInputIndex === undefined && answerNumber !== correctAnswer) {
      incorrectClassName = 'unanswered';
    }

    const correctClassName = answerNumber === correctAnswer ? 'correct' : '';

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

function ResultsView({
  questions,
  correct,
  incorrect,
  userInput,
  correctPoints,
  totalPoints,
  appLocale,
  filteredValue,
  onFilterChange,
}) {
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

  return (
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
        handleChange={onFilterChange}
        appLocale={appLocale}
      />
      {(filteredQuestions || questions).map((question, index) => (
        <div className="result-answer-wrapper" key={nanoid()}>
          <h3
            dangerouslySetInnerHTML={rawMarkup(
              `Q${question.questionIndex}: ${question.question}`,
            )}
          />
          {question.questionPic && <img src={question.questionPic} alt="question" />}
          <div className="result-answer">
            <AnsweredQuestion
              question={question}
              userInputIndex={filteredUserInput ? filteredUserInput[index] : userInput[index]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ResultsView;
