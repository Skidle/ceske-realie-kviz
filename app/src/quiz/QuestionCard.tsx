import { rawMarkup } from '../shared/markdown';
import AnswerFeedback from './AnswerFeedback';
import type { AnswerButtons, IndexedQuestion } from './types';
import type { AppLocale, QuestionType } from '../content/types';

// correctAnswer is a 1-based index held as a string, e.g. "3".
const isCorrectAnswer = (index: number, correctAnswer: string) => index === Number(correctAnswer);

const BASE = 'w-full text-left rounded-lg border px-4 py-3 transition-colors';
const UNANSWERED = 'border-zinc-200 bg-white hover:border-indigo-400 hover:bg-indigo-50';
const CORRECT = 'border-green-600 bg-green-600 text-white';
const INCORRECT = 'border-red-500 bg-red-500 text-white';
const DIMMED = 'border-zinc-200 bg-white text-zinc-400';

interface AnswerContentProps {
  answer: string;
  questionType: QuestionType;
}

const AnswerContent = ({ answer, questionType }: AnswerContentProps) => (
  questionType === 'photo'
    // Sized so all four alternatives fit on screen without scrolling.
    ? <img src={answer} alt="" className="w-full max-h-40 object-contain" />
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

  const styleFor = (index: number) => {
    const state = answerButtons[index];
    if (!state) return UNANSWERED;
    if (state.className === 'correct') return CORRECT;
    if (state.className === 'incorrect') return INCORRECT;
    // Answered, but this is not the one that was picked. Reveal the right answer when
    // the player got it wrong, otherwise fade it back.
    return isCorrectAnswer(index + 1, correctAnswer) && showInstantFeedback ? CORRECT : DIMMED;
  };

  return (
    <div>
      <p className="text-sm text-zinc-500 mb-2">
        {`${appLocale.question} ${questionNumber} / ${questionCount}:`}
      </p>

      <h3
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

      <AnswerFeedback
        showInstantFeedback={showInstantFeedback}
        correctAnswer={isCorrect}
        incorrectAnswer={incorrectAnswer}
      />

      <div className="space-y-2">
        {answers.map((answer, index) => (
          <button
            key={`${question.questionIndex}-${index}`}
            type="button"
            disabled={answerButtons[index]?.disabled || false}
            className={`${BASE} ${styleFor(index)}`}
            onClick={() => onAnswer(index + 1)}
          >
            <AnswerContent answer={answer} questionType={questionType} />
          </button>
        ))}
      </div>

      {showNextQuestionButton && (
        <button
          type="button"
          onClick={onNext}
          className="mt-6 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium
            hover:bg-indigo-700 transition-colors"
        >
          {appLocale.nextQuestionBtn}
        </button>
      )}
    </div>
  );
}

export default QuestionCard;
