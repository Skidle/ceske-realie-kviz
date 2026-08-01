import { appLocale } from '../appLocale';

// A miniature quiz with the same shape as the real data, so tests do not break when
// questions.js changes. Mirrors the real format exactly: 4 text answers, single
// selection, correctAnswer as a 1-based index in a string, point as a string.
const question = (text, correctAnswer, subCategory = 0) => ({
  question: text,
  answers: [`${text} A`, `${text} B`, `${text} C`, `${text} D`],
  correctAnswer,
  category: 0,
  subCategory,
  questionType: 'text',
  answerSelectionType: 'single',
  point: '1',
  questionPic: null,
});

export const quizFixture = {
  quizTitle: 'Testovací kvíz',
  questions: [
    question('Otazka jedna', '3'),
    question('Otazka dva', '1', 1),
  ],
  appLocale,
};

export const categoriesFixture = [
  { name: 'Kategorie A', subCategories: ['Podkategorie A', 'Podkategorie B'] },
  { name: 'Kategorie B', subCategories: ['Podkategorie C'] },
];
