import type { BuiltQuestion } from './build.ts';

/**
 * Compared on letters and digits alone.
 *
 * The layout drops full stops and inserts spaces inside numbers, so a strict comparison
 * reports differences that do not exist: an earlier run of this diff claimed three
 * questions had a changed correct answer, and two of them differed only by a stray space
 * and a missing full stop.
 */
const key = (text: string) => text
  // The 2024 data baked the alternative's letter into its text — "A) Den matek." — which
  // the app then shuffled, so the letters were already appearing out of order on screen.
  // The regenerated data drops them. Stripping the marker here is what makes the diff
  // show the content that changed rather than 300 questions changing at once.
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
 * Questions are matched by their text, so a reworded question reads as one removal and
 * one addition rather than a change. That overstates churn, and there is no reliable way
 * around it: two questions with different wording may or may not be the same question,
 * and only a human can say.
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
