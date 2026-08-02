/** Shape of the quiz data as it is stored. See docs/BEHAVIOR.md.  */

/** Shape of the quiz data. See docs/BEHAVIOR.md for where these values come from. */

export type QuestionType = 'text' | 'photo';

export interface Question {
  question: string;
  /**
   * Four alternatives: text, or image paths when `questionType` is 'photo'.
   */
  answers: string[];
  /**
   * 1-based index as a string: `"3"` is the third alternative. Kept as-is so the
   * importer's output diffs on content; normalising it is a separate data change.
   */
  correctAnswer: string;
  /** Index into the categories list. */
  category: number;
  /** Index into that category's `subCategories`. */
  subCategory: number;
  questionType: QuestionType;
  /** Every question in the official bank has exactly one correct answer. */
  answerSelectionType: 'single';
  /** Point value, also stringified in the source data. Always "1" in practice. */
  point: string;
  /** An image shown with the question itself, as opposed to the answers. */
  questionPic: string | null;
}

export interface Category {
  name: string;
  subCategories: string[];
}

export interface AppLocale {
  landingHeaderText: string;
  question: string;
  startQuizBtn: string;
  resultFilterLabel: string;
  resultFilterAll: string;
  resultFilterCorrect: string;
  resultFilterIncorrect: string;
  resultFilterUnanswered: string;
  nextQuestionBtn: string;
  prevQuestionBtn: string;
  resultPageHeaderText: string;
  resultPagePoint: string;
  pauseScreenDisplay: string;
  timerTimeRemaining: string;
  timerTimeTaken: string;
  pauseScreenPause: string;
  pauseScreenResume: string;
  singleSelectionTagText: string;
  multipleSelectionTagText: string;
  pickNumberOfSelection: string;
  marksOfQuestion: string;
  settings: string;
  realTestLabel: string;
  allCategoriesLabel: string;
  chooseCategoryLabel: string;
  chooseSubCategoryLabel: string;
  allSubCategoriesLabel: string;
  shuffleCheckboxLabel: string;
  backButtonLabel: string;
}

export interface QuizData {
  quizTitle: string;
  questions: Question[];
  appLocale: AppLocale;
}
