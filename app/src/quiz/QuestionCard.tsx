import { Check, X } from 'lucide-react';
import { rawMarkup } from '../shared/markdown';
import AnswerFeedback from './AnswerFeedback';
import type { AnswerButtons, IndexedQuestion } from './types';
import type { AppLocale, QuestionType } from '../content/types';

// correctAnswer is a 1-based index held as a string, e.g. "3".
const isCorrectAnswer = (index: number, correctAnswer: string) => index === Number(correctAnswer);

const BASE = 'w-full text-left rounded border px-4 py-3 transition-colors '
  + 'focus:outline-none focus-visible:ring-2 focus-visible:ring-flag-500 focus-visible:ring-offset-1';
const UNANSWERED = 'border-zinc-200 bg-white hover:border-flag-400 hover:bg-flag-50';
const CORRECT = 'border-right-600 bg-right-50 text-right-700';
const INCORRECT = 'border-wrong-500 bg-wrong-50 text-wrong-700';
const DIMMED = 'border-zinc-200 bg-white text-zinc-400';

/** Never colour alone: an icon and a word carry the same meaning. */
type Mark = 'correct' | 'incorrect' | null;

const Marker = ({ mark }: { mark: Mark }) => {
  if (!mark) return null;

  const isRight = mark === 'correct';
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
      {isRight ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      {isRight ? 'Správně' : 'Nesprávně'}
    </span>
  );
};

interface AnswerContentProps {
  answer: string;
  questionType: QuestionType;
}

const AnswerContent = ({ answer, questionType }: AnswerContentProps) => (
  questionType === 'photo'
    ? <img src={answer} alt="" className="w-full h-32 md:h-40 object-contain" />
    : <span>{answer}</span>
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
  const questionId = `question-${question.questionIndex}`;

  const markFor = (index: number): Mark => {
    const state = answerButtons[index];
    if (!state) return null;
    if (state.className === 'correct') return 'correct';
    if (state.className === 'incorrect') return 'incorrect';
    // Answered, but not the one picked. Reveal the right answer when they got it wrong.
    return isCorrectAnswer(index + 1, correctAnswer) && showInstantFeedback ? 'correct' : null;
  };

  const styleFor = (index: number) => {
    if (!answerButtons[index]) return UNANSWERED;
    const mark = markFor(index);
    if (mark === 'correct') return CORRECT;
    if (mark === 'incorrect') return INCORRECT;
    return DIMMED;
  };

  return (
    <div>
      <p className="text-sm text-zinc-500 mb-2">
        {`${appLocale.question} ${questionNumber} / ${questionCount}:`}
      </p>

      <h3
        id={questionId}
        className="text-lg text-zinc-800 mb-4"
        dangerouslySetInnerHTML={rawMarkup(question.question)}
      />

      {question.questionPic && (
        <img
          src={question.questionPic}
          alt=""
          className="w-full max-h-72 object-contain mb-4"
        />
      )}

      {/* The slot is always here, so answering fills it rather than pushing the
          answers down the page. */}
      <div className="mb-4 min-h-[3.25rem]">
        <AnswerFeedback
          showInstantFeedback={showInstantFeedback}
          correctAnswer={isCorrect}
          incorrectAnswer={incorrectAnswer}
        />
      </div>

      {/* Photo answers go two to a row, so all four fit on screen without scrolling.
          Stacked full width they ran well past a laptop viewport.

          A labelled group rather than a radiogroup: choosing an answer submits it and
          cannot be undone, and arrow keys in a radiogroup both move and select, so a
          keyboard user exploring the options would answer by accident. */}
      <div
        role="group"
        aria-labelledby={questionId}
        className={questionType === 'photo' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}
      >
        {answers.map((answer, index) => (
          <button
            key={`${question.questionIndex}-${index}`}
            type="button"
            disabled={answerButtons[index]?.disabled || false}
            className={`${BASE} ${questionType === 'photo' ? 'p-2' : ''} ${styleFor(index)}`}
            onClick={() => onAnswer(index + 1)}
          >
            <span className="flex items-center justify-between gap-3">
              <AnswerContent answer={answer} questionType={questionType} />
              <Marker mark={markFor(index)} />
            </span>
          </button>
        ))}
      </div>

      {/* Reserved for the same reason: the page keeps its height when the button
          appears, so nothing below it moves. */}
      <div className="mt-6 min-h-[3.25rem]">
        {showNextQuestionButton && (
          <button
            type="button"
            onClick={onNext}
            className="w-full bg-flag-600 text-white px-6 py-3 rounded font-medium
              hover:bg-flag-700 transition-colors focus:outline-none
              focus-visible:ring-2 focus-visible:ring-flag-500 focus-visible:ring-offset-1"
          >
            {appLocale.nextQuestionBtn}
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestionCard;
