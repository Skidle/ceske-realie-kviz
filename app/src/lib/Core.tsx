import QuestionView from './core-components/QuestionView';
import ResultsView from './core-components/ResultsView';
import { useQuizState } from './useQuizState';
import type { AppLocale, IndexedQuestion } from '../types';

interface CoreProps {
  questions: IndexedQuestion[];
  appLocale: AppLocale;
  showInstantFeedback: boolean;
}

function Core({ questions, appLocale, showInstantFeedback }: CoreProps) {
  const quiz = useQuizState(questions);

  return (
    <div className="questionWrapper">
      {quiz.endQuiz ? (
        <ResultsView
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
        <QuestionView
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

export default Core;
