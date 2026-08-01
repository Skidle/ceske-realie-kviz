import QuestionCard from './QuestionCard';
import ResultsPanel from './ResultsPanel';
import { useQuizState } from './useQuizState';
import type { IndexedQuestion } from './types';
import type { AppLocale } from '../content/types';

interface QuizRunnerProps {
  questions: IndexedQuestion[];
  appLocale: AppLocale;
  showInstantFeedback: boolean;
}

function QuizRunner({ questions, appLocale, showInstantFeedback }: QuizRunnerProps) {
  const quiz = useQuizState(questions);

  return (
    <div className="questionWrapper">
      {quiz.endQuiz ? (
        <ResultsPanel
          questions={questions}
          correct={quiz.correct}
          incorrect={quiz.incorrect}
          userInput={quiz.userInput}
          correctPoints={quiz.correctPoints}
          totalPoints={quiz.totalPoints}
          appLocale={appLocale}
          filteredValue={quiz.filteredValue}
          onFilterChange={quiz.filterResults}
        />
      ) : (
        <QuestionCard
          question={quiz.activeQuestion}
          questionNumber={quiz.currentQuestionIndex + 1}
          questionCount={questions.length}
          appLocale={appLocale}
          showInstantFeedback={showInstantFeedback}
          isCorrect={quiz.isCorrect}
          incorrectAnswer={quiz.incorrectAnswer}
          answerButtons={quiz.buttons}
          showNextQuestionButton={quiz.showNextQuestionButton}
          onAnswer={quiz.answerQuestion}
          onNext={quiz.goToNextQuestion}
        />
      )}
    </div>
  );
}

export default QuizRunner;
