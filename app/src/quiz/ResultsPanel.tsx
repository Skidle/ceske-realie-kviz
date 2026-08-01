import { Check, X } from 'lucide-react';
import ResultFilter from './ResultFilter';
import { rawMarkup } from '../shared/markdown';
import type { IndexedQuestion, ResultFilterValue } from './types';
import type { AppLocale } from '../content/types';

const BASE = 'w-full text-left rounded-lg border px-4 py-2';
const CORRECT = 'border-right-600 bg-right-50 text-right-700';
const PICKED_WRONG = 'border-wrong-500 bg-wrong-50 text-wrong-700';
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
      <div key={`${question.questionIndex}-${index}`}>
        <button type="button" disabled className={`${BASE} ${style}`}>
          <span className="flex items-center justify-between gap-3">
            {questionType === 'photo'
              ? <img src={answer} alt="" className="w-full h-28 object-contain" />
              : <span>{answer}</span>}
            {(isCorrect || wasPicked) && (
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {isCorrect ? 'Správně' : 'Vaše odpověď'}
              </span>
            )}
          </span>
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
            <div className={question.questionType === 'photo' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
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
