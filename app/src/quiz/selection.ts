import type { IndexedQuestion, QuestionSelection } from './types';
import type { Question } from '../content/types';

/**
 * Reorders each question's answers, recomputing `correctAnswer` so it still points at the
 * same answer text. Getting this wrong would silently mark the wrong answer correct in
 * every shuffled quiz, which is why it is the most heavily tested function here.
 */
const shuffleAnswerSequence = (oldQuestions: Question[]): Question[] => oldQuestions.map(
  (question) => {
    const answersWithIndex: Array<[string, number]> = question.answers.map(
      (answer, index) => [answer, index],
    );
    const shuffled = answersWithIndex.sort(() => Math.random() - 0.5);
    const newCorrectAnswer = shuffled.findIndex(
      ([, originalIndex]) => `${originalIndex + 1}` === `${question.correctAnswer}`,
    ) + 1;

    return {
      ...question,
      correctAnswer: `${newCorrectAnswer}`,
      answers: shuffled.map(([answer]) => answer),
    };
  },
);

/** Fisher-Yates, in place. */
const shuffleQuestions = <T>(questions: T[]): T[] => {
  for (let i = questions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
};

const shuffleEverything = (questions: Question[]): Question[] => shuffleAnswerSequence(
  shuffleQuestions(questions),
);

/**
 * One question from each of the 30 topics, which is how the real exam is built:
 *
 *   "Databanka testových úloh je rozčleněna do 30 témat, z každého tématu bude do testu
 *    zařazena 1 testová úloha."
 *
 * A topic is a category and subcategory together. Drawing 16 questions from the first
 * category and 7 from each of the others gives the same totals — there are 16 topics in
 * the first and 7 in the others — but not the same test: it can ask five questions about
 * Doprava and none about Volby.
 */
const createRealTest = (allQuestions: Question[]): Question[] => {
  const byTopic = new Map<string, Question[]>();

  for (const question of allQuestions) {
    const topic = `${question.category}-${question.subCategory}`;
    byTopic.set(topic, [...(byTopic.get(topic) ?? []), question]);
  }

  const selected = [...byTopic.values()]
    .map((questions) => shuffleQuestions([...questions])[0])
    .filter(Boolean);

  return shuffleEverything(selected);
};

export const getFinalQuestions = ({
  questions,
  selectedCategory,
  selectedSubCategory,
  shuffle,
  isRealTest,
}: QuestionSelection): IndexedQuestion[] => {
  let finalQuestions = [...questions];

  if (isRealTest) {
    finalQuestions = createRealTest(finalQuestions);
  } else {
    if (selectedCategory !== '') {
      finalQuestions = finalQuestions.filter(
        (question) => question.category === selectedCategory,
      );
    }

    if (selectedSubCategory !== '') {
      finalQuestions = finalQuestions.filter(
        (question) => question.subCategory === selectedSubCategory,
      );
    }

    if (shuffle) {
      finalQuestions = shuffleEverything(finalQuestions);
    }
  }

  return finalQuestions.map((question, index) => ({
    ...question,
    questionIndex: index + 1,
  }));
};
