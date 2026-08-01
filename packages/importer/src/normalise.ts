/**
 * Text extracted from the PDF has spaces in the middle of things that are not words:
 * "1 6. 1 2. 2024" is 16.12.2024, and "7 . 12. 2015" is 7.12.2015. The layout puts them
 * there; they carry no meaning.
 */
export function normaliseDate(raw: string): string | undefined {
  const digits = raw.replace(/\s+/g, '');
  const match = digits.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (!match) return undefined;

  const [, day, month, year] = match;
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
}

/** Collapses the runs of whitespace and line breaks the layout introduces mid-sentence. */
export function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Page numbers are printed on their own line and are indistinguishable from content once
 * the layout is gone. They are dropped before anything tries to read a question number.
 */
export function stripPageNumbers(text: string): string {
  return text.replace(/^\s*\d{1,3}\s*$/gm, '');
}
