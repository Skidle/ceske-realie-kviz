import type { SourceRecord } from './types.ts';

/**
 * The question-bank PDFs linked from the databanka page.
 *
 * Read from the page rather than hardcoded: the URL encodes the publication date, and
 * superseded URLs keep returning 200 forever, so a fixed URL would look unchanged
 * indefinitely while the bank moved on.
 */
export function extractPdfLinks(html: string): string[] {
  const matches = html.matchAll(/href="([^"]*databanka[^"]*\.pdf)"/gi);
  return [...new Set([...matches].map((match) => match[1]))];
}

/**
 * The edition marker from the PDF's title page, e.g.
 * "Vydání desáté (elektronické), upravené, Praha, 2026 Aktualizováno 5. 1. 2026".
 *
 * Preferred over hashing the file: a hash changes on any trivial re-save and says nothing
 * about what moved.
 */
export function parseEdition(pdfText: string): Omit<SourceRecord, 'pdfUrl'> | null {
  const text = pdfText.replace(/\s+/g, ' ');
  const match = text.match(/Vydání[^©]*?Aktualizováno\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/);

  if (!match) return null;

  return {
    edition: match[0].trim(),
    updatedAt: match[1].replace(/\s+/g, ' ').trim(),
    // 30 topics of 10 questions. A change here means the bank was restructured.
    topicCount: (text.match(/SPRÁVNÉ ŘEŠENÍ/g) ?? []).length,
  };
}
