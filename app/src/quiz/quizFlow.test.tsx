import { render, screen, fireEvent } from '@testing-library/react';
import QuizSetup from './QuizSetup';
import { quizFixture, categoriesFixture } from '../test/fixtures/quiz';

// Smoke test over the whole quiz flow. A refactor that needs this file edited to stay
// green changed behaviour. Edited twice on purpose: Czech text (#7), <select> (#16).

const renderQuiz = () => render(
  <QuizSetup quiz={quizFixture} categories={categoriesFixture} />,
);

// fireEvent, not user-event: @testing-library/dom is hoisted at v10 while RTL carries a
// nested v8, so user-event's clicks escape RTL's act() and leave React updates unflushed.
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

    // Answers were keyed with nanoid(), so React recreated all four buttons every render.
    // On image questions that tore the pictures out and threw the page to the top.
    it('updates the answer buttons in place rather than recreating them', () => {
      renderQuiz();
      startQuiz();

      const before = screen.getByRole('button', { name: 'Otazka jedna B' });

      chooseAnswer('Otazka jedna C');

      const after = screen.getByRole('button', { name: 'Otazka jedna B' });
      expect(after).toBe(before);
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

      // A <select>, so every option is present without opening anything.
      expect(screen.getByRole('combobox', { name: 'Zobrazit' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Správně' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Nesprávně' })).toBeInTheDocument();
    });

    it('filters the result list down to the incorrect answers', () => {
      renderQuiz();
      startQuiz();

      chooseAnswer('Otazka jedna C'); // correct
      goToNextQuestion();
      chooseAnswer('Otazka dva D'); // wrong
      goToNextQuestion();

      fireEvent.change(screen.getByRole('combobox', { name: 'Zobrazit' }), {
        target: { value: 'incorrect' },
      });

      expect(screen.getByText(/Otázka 2: Otazka dva/)).toBeInTheDocument();
      expect(screen.queryByText(/Otázka 1: Otazka jedna/)).not.toBeInTheDocument();
    });
  });
});
