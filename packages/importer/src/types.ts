export type AnswerLetter = 'A' | 'B' | 'C' | 'D';

export const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D'];

/** One of the 30 themes the bank is divided into. */
export interface Topic {
  /** 1..30, as printed. */
  number: number;
  /** e.g. "DOPRAVA". */
  title: string;
  /** Everything between this heading and the next. */
  body: string;
}

/** A question as it appears in the PDF, before it is matched to its answer key. */
export interface ParsedQuestion {
  /** 1..10 within its topic. */
  number: number;
  text: string;
  /** Keyed by letter, because the PDF does not always print them in order. */
  answers: Record<AnswerLetter, string>;
  /** Normalised to DD.MM.YYYY. Absent if the PDF did not print one. */
  updatedAt?: string;
  /**
   * True when the alternatives are images: the letters are printed with nothing after
   * them. The text carries no way to tell which picture is which, so these need the
   * image extraction rather than this parser.
   */
  isPhoto: boolean;
}

/** Correct answers for one topic, keyed by question number. */
export type AnswerKey = Record<number, AnswerLetter>;
