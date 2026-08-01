import ResultFilter from './ResultFilter';
import { rawMarkup } from '../shared/markdown';
import type { IndexedQuestion, ResultFilterValue } from './types';
import type { AppLocale } from '../content/types';

const BASE = 'w-full text-left rounded-lg border px-4 py-2';
const CORRECT = 'border-green-600 bg-green-600 text-white';
const PICKED_WRONG = 'border-red-500 bg-red-500 text-white';
const OTHER = 'border-zinc-200 bg-white text-zinc-500';

interface AnsweredQuestionProps {
  question: IndexedQuestion;
  /** The 1-based answer the player chose, or undefined if they never answered. */
  userInputIndex: number | undefined;
}

const AnsweredQuestion = ({ question, userInputIndex }: AnsweredQuestionProps) => {
  const { answers, correctAnswer, questionType } = question;

  return answers.map((answer, index) => {
    const answerNumber = `${index + 1}`;
    const isCorrect = answerNumber === correctAnswer;
    const wasPicked = answerNumber === `${userInputIndex}`;

    let style = OTHER;
    if (isCorrect) style = CORRECT;
    else if (wasPicked) style = PICKED_WRONG;

    return (
      <div key={`${question.questionIndex}-${index}`} className="flex items-center gap-2">
        <span className="w-6 shrink-0 text-sm text-zinc-400">
          {wasPicked ? '→' : ''}
        </span>
        <button type="button" disabled className={`${BASE} ${style}`}>
          {questionType === 'photo'
            ? <img src={answer} alt="" className="w-full max-h-32 object-contain" />
            : <span>{answer}</span>}
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
    <div>
      <h2 className="text-2xl font-serif text-zinc-800">
        {appLocale.resultPageHeaderText
          .replace('<correctIndexLength>', String(correct.length))
          .replace('<questionLength>', String(questions.length))}
      </h2>
      <p className="mt-1 mb-6 text-zinc-600">
        {appLocale.resultPagePoint
          .replace('<correctPoints>', String(correctPoints))
          .replace('<totalPoints>', String(totalPoints))}
      </p>

      <ResultFilter
        filteredValue={filteredValue}
        onChange={onFilterChange}
        appLocale={appLocale}
      />

      <div className="mt-6 space-y-6">
        {(filteredQuestions || questions).map((question, index) => (
          <div key={question.questionIndex} className="border-t border-zinc-200 pt-4">
            <h3
              className="text-zinc-800 mb-3"
              dangerouslySetInnerHTML={rawMarkup(
                `${appLocale.question} ${question.questionIndex}: ${question.question}`,
              )}
            />
            {question.questionPic && (
              <img
                src={question.questionPic}
                alt=""
                className="w-full max-h-60 object-contain mb-3"
              />
            )}
            <div className="space-y-2">
              <AnsweredQuestion
                question={question}
                userInputIndex={filteredUserInput ? filteredUserInput[index] : userInput[index]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResultsPanel;
