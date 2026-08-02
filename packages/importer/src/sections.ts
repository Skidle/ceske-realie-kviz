/**
 * Everything between one match of `marker` and the next.
 *
 * The document is a stack of these: topics inside the file, questions inside a topic,
 * alternatives inside a question, citation entries inside a topic. Each was slicing by
 * hand with its own `match.index` arithmetic, and one of them carried a `- 2` to back over
 * the marker it had already stepped past. Doing it once removes both the repetition and
 * the arithmetic.
 *
 * `marker` must be a global regular expression, or `matchAll` refuses it.
 */
export function sections(text: string, marker: RegExp): Section[] {
  const found = [...text.matchAll(marker)];

  return found.map((match, index) => ({
    match,
    body: text.slice(match.index + match[0].length, found[index + 1]?.index ?? text.length),
  }));
}

export interface Section {
  /** The marker itself, so callers can read its capture groups. */
  match: RegExpExecArray;
  /** What follows it, up to the next marker. */
  body: string;
}
