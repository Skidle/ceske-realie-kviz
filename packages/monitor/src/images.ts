import { questions } from '../../../app/src/content/questions.ts';
import type { ImageUse } from './types.ts';

/**
 * Every image the questions still load from the source site, and which question each one
 * belongs to.
 *
 * Derived from the question data rather than kept as a list, so an image added or removed
 * by editing the questions is picked up on the next recording instead of drifting out of
 * sync silently.
 */
export function hotlinkedImages(): Map<string, ImageUse> {
  const uses = new Map<string, ImageUse>();

  const add = (url: string, question: string, role: string) => {
    if (url.startsWith('http') && !uses.has(url)) uses.set(url, { question, role });
  };

  for (const question of questions) {
    if (question.questionType === 'photo') {
      question.answers.forEach((url, index) => add(url, question.question, `answer ${index + 1}`));
    }
    if (question.questionPic) add(question.questionPic, question.question, 'question image');
  }

  return uses;
}
