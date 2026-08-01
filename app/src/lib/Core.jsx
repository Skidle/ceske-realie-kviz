import React from 'react';
import QuestionView from './core-components/QuestionView';
import ResultsView from './core-components/ResultsView';
import { useQuizState } from './useQuizState';

function Core({ questions, appLocale, showInstantFeedback }) {
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
