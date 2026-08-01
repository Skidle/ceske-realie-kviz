import ResultFilter from './ResultFilter';
import { rawMarkup } from '../shared/markdown';
import type { IndexedQuestion, ResultFilterValue } from './types';
import type { AppLocale } from '../content/types';

interface AnsweredQuestionProps {
  question: IndexedQuestion;
  /** The 1-based answer the player chose, or undefined if they never answered. */
  userInputIndex: number | undefined;
}

const AnsweredQuestion = ({ question, userInputIndex }: AnsweredQuestionProps) => {
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
      <div key={`${question.questionIndex}-${index}`}>
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

interface ResultsPanelProps {
  questions: IndexedQuestion[];
  correct: number[];
  incorrect: number[];
  userInput: number[];
  correctPoints: number;
  totalPoints: number;
  appLocale: AppLocale;
  filteredValue: ResultFilterValue;
  onFilterChange: (value: ResultFilterValue) => void;
}

function ResultsPanel({
  questions,
  correct,
  incorrect,
  userInput,
  correctPoints,
  totalPoints,
  appLocale,
  filteredValue,
  onFilterChange,
}: ResultsPanelProps) {
  let filteredQuestions: IndexedQuestion[] | undefined;
  let filteredUserInput: number[] | undefined;

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
          .replace('<correctIndexLength>', String(correct.length))
          .replace('<questionLength>', String(questions.length))}
      </h2>
      <h2>
        {appLocale.resultPagePoint
          .replace('<correctPoints>', String(correctPoints))
          .replace('<totalPoints>', String(totalPoints))}
      </h2>
      <br />
      <ResultFilter
        filteredValue={filteredValue}
        onChange={onFilterChange}
        appLocale={appLocale}
      />
      {(filteredQuestions || questions).map((question, index) => (
        <div className="result-answer-wrapper" key={question.questionIndex}>
          <h3
            dangerouslySetInnerHTML={rawMarkup(
              `${appLocale.question} ${question.questionIndex}: ${question.question}`,
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

export default ResultsPanel;
