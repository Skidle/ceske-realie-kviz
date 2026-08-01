import { render, screen, fireEvent } from '@testing-library/react';
import Quiz from './Quiz';
import { quizFixture, categoriesFixture } from '../__fixtures__/quiz';

// End-to-end smoke test over the whole quiz flow. This is the safety net for the Phase 1
// refactor: it must keep passing WITHOUT MODIFICATION. If a refactor requires editing
// this file to stay green, the refactor changed behaviour.

const renderQuiz = () => render(
  <Quiz quiz={quizFixture} categories={categoriesFixture} />,
);

// fireEvent from RTL, not user-event: @testing-library/dom is hoisted at v10 while RTL 13
// carries its own nested v8, so user-event's clicks go through a different instance and
// escape RTL's act() wrapper, leaving React 18 updates unflushed. Revisit in Phase 2.
const clickButton = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

const startQuiz = () => clickButton('Spustit kvíz');
const goToNextQuestion = () => clickButton('Další');
const chooseAnswer = (label: string) => clickButton(label);

describe('Quiz', () => {
  describe('start screen', () => {
    it('shows the quiz title and the question count', () => {
      renderQuiz();

      expect(screen.getByText('Testovací kvíz')).toBeInTheDocument();
      expect(screen.getByText('Množství otázek: 2')).toBeInTheDocument();
    });

    it('offers every category', () => {
      renderQuiz();

      expect(screen.getByRole('option', { name: 'Kategorie A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Kategorie B' })).toBeInTheDocument();
    });

    it('shows the first question once started', () => {
      renderQuiz();

      startQuiz();

      expect(screen.getByText('Otazka jedna')).toBeInTheDocument();
      expect(screen.getByText('Otázka 1 / 2:')).toBeInTheDocument();
    });
  });

  describe('playing through a quiz', () => {
    it('scores one correct and one incorrect answer', () => {
      renderQuiz();
      startQuiz();

      chooseAnswer('Otazka jedna C'); // correctAnswer '3'
      goToNextQuestion();

      expect(screen.getByText('Otazka dva')).toBeInTheDocument();

      chooseAnswer('Otazka dva D'); // correctAnswer is '1', so this is wrong
      goToNextQuestion();

      expect(screen.getByText(/Máte spravně 1 z 2 otázek/)).toBeInTheDocument();
    });

    it('awards points for correct answers only', () => {
      renderQuiz();
      startQuiz();

      chooseAnswer('Otazka jedna C');
      goToNextQuestion();
      chooseAnswer('Otazka dva D');
      goToNextQuestion();

      expect(screen.getByText(/Získal\(a\) jste 1 z 2 bodů/)).toBeInTheDocument();
    });

    it('scores a fully correct run', () => {
      renderQuiz();
      startQuiz();

      chooseAnswer('Otazka jedna C');
      goToNextQuestion();
      chooseAnswer('Otazka dva A'); // correctAnswer '1'
      goToNextQuestion();

      expect(screen.getByText(/Máte spravně 2 z 2 otázek/)).toBeInTheDocument();
    });

    it('offers the result filter once finished', () => {
      renderQuiz();
      startQuiz();

      chooseAnswer('Otazka jedna C');
      goToNextQuestion();
      chooseAnswer('Otazka dva A');
      goToNextQuestion();

      // The filter is a custom dropdown, closed by default and showing only its
      // current value. Opening it reveals the choices.
      clickButton('Vše');

      expect(screen.getByRole('menuitem', { name: 'Správně' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Nesprávně' })).toBeInTheDocument();
    });

    it('filters the result list down to the incorrect answers', () => {
      renderQuiz();
      startQuiz();

      chooseAnswer('Otazka jedna C'); // correct
      goToNextQuestion();
      chooseAnswer('Otazka dva D'); // wrong
      goToNextQuestion();

      clickButton('Vše');
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nesprávně' }));

      expect(screen.getByText(/Otázka 2: Otazka dva/)).toBeInTheDocument();
      expect(screen.queryByText(/Otázka 1: Otazka jedna/)).not.toBeInTheDocument();
    });
  });
});
