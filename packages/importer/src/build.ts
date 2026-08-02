import { parseAnswerKey, parseQuestions } from './parse.ts';
import { LETTERS } from './types.ts';
import type { Citation } from './citations.ts';
import type { ParsedQuestion, Topic } from './types.ts';

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

export interface BuildProblem {
  topicNumber: number;
  questionNumber: number;
  reason: string;
}

/** One question, either built or refused. Never silently absent. */
type Outcome = { question: BuiltQuestion } | { problem: BuildProblem };

/** Where a fetched picture lives, or null when it was never fetched. */
type ImagePath = (name: string) => string | null;

/**
 * The 30 topics are the app's 30 subcategories, in order: 16 in the first category, then
 * 7, then 7. That is also why the exam's 30 questions come out split 16/7/7.
 */
const SUBCATEGORY_COUNTS = [16, 7, 7];

const PLACES = SUBCATEGORY_COUNTS.flatMap((count, category) => Array.from(
  { length: count },
  (_, subCategory) => ({ category, subCategory }),
));

/** Topic 1 to 30 onto the app's category and subcategory; null for anything else. */
export function placeTopic(topicNumber: number): { category: number; subCategory: number } | null {
  return PLACES[topicNumber - 1] ?? null;
}

/** Where a picture lives once it has been fetched. Named by what it is, not where it sat. */
export function imageFileName(citation: Citation): string {
  const suffix = citation.letter ? `-${citation.letter.toLowerCase()}` : '-question';
  return `t${citation.topicNumber}-q${citation.questionNumber}${suffix}`;
}

/** The four alternatives, or the reason they could not be assembled. */
function answersFor(
  parsed: ParsedQuestion,
  pictures: Citation[],
  imagePath: ImagePath,
): { answers: string[] } | { reason: string } {
  if (!parsed.isPhoto) {
    const answers = LETTERS.map((letter) => parsed.answers[letter]);
    return answers.every(Boolean) ? { answers } : { reason: 'an alternative is empty' };
  }

  const cited = LETTERS.map((letter) => pictures.find((picture) => picture.letter === letter));

  if (cited.some((picture) => picture === undefined)) {
    return { reason: 'alternatives are pictures but the citations do not cover all four' };
  }

  const paths = cited.map((picture) => imagePath(imageFileName(picture!)));

  // An alternative that is a picture cannot fall back to anything, unlike a question's
  // illustration, so a missing file has to stop the question being built.
  return paths.every((path) => path !== null)
    ? { answers: paths as string[] }
    : { reason: 'a picture for one of the alternatives is not on disk' };
}

function buildQuestion(
  topic: Topic,
  parsed: ParsedQuestion,
  place: { category: number; subCategory: number },
  citations: Citation[],
  imagePath: ImagePath,
): Outcome {
  const refuse = (reason: string): Outcome => ({
    problem: { topicNumber: topic.number, questionNumber: parsed.number, reason },
  });

  const correct = parseAnswerKey(topic.body)[parsed.number];
  if (!correct) return refuse('no correct answer in the topic key');

  // The citations for this one question, out of every citation in the document.
  const pictures = citations.filter(
    (citation) => citation.topicNumber === topic.number && citation.questionNumber === parsed.number,
  );
  const built = answersFor(parsed, pictures, imagePath);
  if ('reason' in built) return refuse(built.reason);

  const questionPic = pictures.find((citation) => !citation.letter);

  return {
    question: {
      question: parsed.text,
      answers: built.answers,
      correctAnswer: String(LETTERS.indexOf(correct) + 1),
      category: place.category,
      subCategory: place.subCategory,
      questionType: parsed.isPhoto ? 'photo' : 'text',
      answerSelectionType: 'single',
      point: '1',
      questionPic: questionPic ? imagePath(imageFileName(questionPic)) : null,
    },
  };
}

function buildTopic(topic: Topic, citations: Citation[], imagePath: ImagePath): Outcome[] {
  const place = placeTopic(topic.number);

  if (!place) {
    return [{
      problem: { topicNumber: topic.number, questionNumber: 0, reason: 'topic number is outside 1..30' },
    }];
  }

  return parseQuestions(topic).map(
    (parsed) => buildQuestion(topic, parsed, place, citations, imagePath),
  );
}

/**
 * Turns parsed topics into stored questions, refusing rather than guessing when something
 * does not line up. A question that cannot be built is reported, not silently dropped:
 * quietly losing one is how a bank of 300 becomes a bank of 299 without anyone noticing.
 */
export function buildQuestions(
  topics: Topic[],
  citations: Citation[],
  imagePath: ImagePath,
): { questions: BuiltQuestion[]; problems: BuildProblem[] } {
  const outcomes = topics.flatMap((topic) => buildTopic(topic, citations, imagePath));

  return {
    questions: outcomes.flatMap((outcome) => ('question' in outcome ? [outcome.question] : [])),
    problems: outcomes.flatMap((outcome) => ('problem' in outcome ? [outcome.problem] : [])),
  };
}
