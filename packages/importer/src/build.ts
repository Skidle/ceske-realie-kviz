import { parseAnswerKey, parseQuestions } from './parse.ts';
import { LETTERS } from './types.ts';
import type { Citation } from './citations.ts';
import type { Topic } from './types.ts';

/**
 * A question in the shape the app stores, so a regenerated file can be diffed against the
 * current one without the format getting in the way.
 */
export interface BuiltQuestion {
  question: string;
  answers: string[];
  /** 1-based index of the correct answer, as a string. See app/src/content/types.ts. */
  correctAnswer: string;
  category: number;
  subCategory: number;
  questionType: 'text' | 'photo';
  answerSelectionType: 'single';
  point: string;
  questionPic: string | null;
}

/**
 * The 30 topics are the app's 30 subcategories, in order: 16 in the first category, then
 * 7, then 7. That is also why the exam's 30 questions come out split 16/7/7.
 */
const SUBCATEGORY_COUNTS = [16, 7, 7];

export function placeTopic(topicNumber: number): { category: number; subCategory: number } | null {
  if (topicNumber < 1) return null;

  let remaining = topicNumber - 1;

  for (let category = 0; category < SUBCATEGORY_COUNTS.length; category += 1) {
    if (remaining < SUBCATEGORY_COUNTS[category]) return { category, subCategory: remaining };
    remaining -= SUBCATEGORY_COUNTS[category];
  }

  return null;
}

/** Where a picture lives once it has been fetched. Named by what it is, not where it sat. */
export function imageFileName(citation: Citation): string {
  const suffix = citation.letter ? `-${citation.letter.toLowerCase()}` : '-question';
  return `t${citation.topicNumber}-q${citation.questionNumber}${suffix}`;
}

export interface BuildProblem {
  topicNumber: number;
  questionNumber: number;
  reason: string;
}

/**
 * Turns parsed topics into stored questions, refusing rather than guessing when something
 * does not line up. A question that cannot be built is reported, not silently dropped:
 * quietly losing one is how a bank of 300 becomes a bank of 299 without anyone noticing.
 */
export function buildQuestions(
  topics: Topic[],
  citations: Citation[],
  imagePath: (name: string) => string,
): { questions: BuiltQuestion[]; problems: BuildProblem[] } {
  const questions: BuiltQuestion[] = [];
  const problems: BuildProblem[] = [];

  for (const topic of topics) {
    const key = parseAnswerKey(topic.body);
    const place = placeTopic(topic.number);

    if (!place) {
      problems.push({ topicNumber: topic.number, questionNumber: 0, reason: 'topic number is outside 1..30' });
      continue;
    }

    for (const parsed of parseQuestions(topic)) {
      const correct = key[parsed.number];
      const report = (reason: string) => problems.push({
        topicNumber: topic.number,
        questionNumber: parsed.number,
        reason,
      });

      if (!correct) {
        report('no correct answer in the topic key');
        continue;
      }

      const forQuestion = citations.filter(
        (c) => c.topicNumber === topic.number && c.questionNumber === parsed.number,
      );
      const questionPic = forQuestion.find((c) => !c.letter);

      let answers: string[];

      if (parsed.isPhoto) {
        const pictures = LETTERS.map((letter) => forQuestion.find((c) => c.letter === letter));

        if (pictures.some((picture) => !picture)) {
          report('alternatives are pictures but the citations do not cover all four');
          continue;
        }

        answers = pictures.map((picture) => imagePath(imageFileName(picture!)));
      } else {
        answers = LETTERS.map((letter) => parsed.answers[letter]);

        if (answers.some((answer) => !answer)) {
          report('an alternative is empty');
          continue;
        }
      }

      questions.push({
        question: parsed.text,
        answers,
        correctAnswer: String(LETTERS.indexOf(correct) + 1),
        category: place.category,
        subCategory: place.subCategory,
        questionType: parsed.isPhoto ? 'photo' : 'text',
        answerSelectionType: 'single',
        point: '1',
        questionPic: questionPic ? imagePath(imageFileName(questionPic)) : null,
      });
    }
  }

  return { questions, problems };
}
