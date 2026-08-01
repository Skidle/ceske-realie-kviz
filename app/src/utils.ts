import type { IndexedQuestion, Question, QuestionSelection } from './types';

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

/** The real exam draws 16 questions from category 0 and 7 from each of the other two. */
const REAL_TEST_QUESTIONS_PER_CATEGORY = [16, 7, 7];

const createRealTest = (allQuestions: Question[]): Question[] => {
  const selected = REAL_TEST_QUESTIONS_PER_CATEGORY.flatMap((count, category) => {
    const inCategory = allQuestions.filter((question) => question.category === category);
    return shuffleQuestions([...inCategory]).slice(0, count);
  });

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
