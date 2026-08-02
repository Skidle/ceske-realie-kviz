import type { BuiltQuestion } from './build.ts';

/**
 * Letters and digits alone. The layout drops full stops and puts spaces inside numbers,
 * so a strict comparison reported three changed answers where only one had changed.
 */
const key = (text: string) => text
  // The 2024 data stored "A) Den matek."; the regenerated data drops the prefix. Without
  // this the diff reports all 300 questions as changed.
  .replace(/^[A-D]\)\s*/, '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[^a-z0-9]/g, '');

const correctText = (question: BuiltQuestion) => question.answers[Number(question.correctAnswer) - 1] ?? '';

export interface QuestionChange {
  question: string;
  /** What changed about a question present in both. */
  what: 'correct answer' | 'alternatives' | 'topic';
  before: string;
  after: string;
}

export interface Diff {
  added: BuiltQuestion[];
  removed: BuiltQuestion[];
  changed: QuestionChange[];
  unchanged: number;
}

/**
 * Matched by question text, so rewording reads as one removal plus one addition. That
 * overstates churn; whether two wordings are the same question needs a person.
 */
export function diffQuestions(before: BuiltQuestion[], after: BuiltQuestion[]): Diff {
  const beforeByText = new Map(before.map((q) => [key(q.question), q]));
  const afterByText = new Map(after.map((q) => [key(q.question), q]));

  const added = after.filter((q) => !beforeByText.has(key(q.question)));
  const removed = before.filter((q) => !afterByText.has(key(q.question)));
  const changed: QuestionChange[] = [];
  let unchanged = 0;

  for (const current of after) {
    const previous = beforeByText.get(key(current.question));
    if (!previous) continue;

    const wasCorrect = key(correctText(previous));
    const isCorrect = key(correctText(current));
    const wasOptions = previous.answers.map(key).sort().join('|');
    const isOptions = current.answers.map(key).sort().join('|');
    const wasTopic = `${previous.category}-${previous.subCategory}`;
    const isTopic = `${current.category}-${current.subCategory}`;

    if (wasCorrect !== isCorrect) {
      changed.push({
        question: current.question,
        what: 'correct answer',
        before: correctText(previous),
        after: correctText(current),
      });
    } else if (wasOptions !== isOptions) {
      changed.push({
        question: current.question, what: 'alternatives', before: wasOptions, after: isOptions,
      });
    } else if (wasTopic !== isTopic) {
      changed.push({
        question: current.question, what: 'topic', before: wasTopic, after: isTopic,
      });
    } else {
      unchanged += 1;
    }
  }

  return { added, removed, changed, unchanged };
}

export function describeDiff(diff: Diff): string {
  const lines = [
    `unchanged: ${diff.unchanged}`,
    `changed:   ${diff.changed.length}`,
    `added:     ${diff.added.length}`,
    `removed:   ${diff.removed.length}`,
  ];

  const answers = diff.changed.filter((c) => c.what === 'correct answer');
  if (answers.length) {
    lines.push('', 'Correct answer changed:');
    answers.forEach((c) => {
      lines.push(`  ${c.question}`);
      lines.push(`    was: ${c.before}`);
      lines.push(`    now: ${c.after}`);
    });
  }

  return lines.join('\n');
}
