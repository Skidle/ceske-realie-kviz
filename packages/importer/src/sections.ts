/**
 * Everything between one match of `marker` and the next.
 *
 * The document nests these: topics in the file, questions in a topic, alternatives in a
 * question, citations in a topic. `marker` must be a global regular expression.
 */
export function sections(text: string, marker: RegExp): Section[] {
  const found = [...text.matchAll(marker)];

  return found.map((match, index) => ({
    match,
    body: text.slice(match.index + match[0].length, found[index + 1]?.index ?? text.length),
  }));
}

export interface Section {
  /** The marker, for its capture groups. */
  match: RegExpExecArray;
  /** What follows it, up to the next marker. */
  body: string;
}
