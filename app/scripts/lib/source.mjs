// Reads the two things this project depends on: the official question bank page, and the
// PDF it links to.

import { extractText, getDocumentProxy } from 'unpdf';
import { getBytes, getText, sha256 } from './http.mjs';

export const DATABANKA_PAGE = 'https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/';

/**
 * Finds the question-bank PDF linked from the page.
 *
 * The link must be read from the page rather than hardcoded: its URL encodes the
 * publication date (.../2026/01/OBC_databanka_testovychuloh_260105.pdf) and superseded
 * URLs keep returning 200 indefinitely, so watching a fixed URL would report "unchanged"
 * forever while the bank moved on.
 *
 * Finding no link, or more than one, is a failure to verify — not a clean result.
 */
export function extractPdfLinks(html) {
  const links = [...html.matchAll(/href="([^"]*databanka[^"]*\.pdf)"/gi)].map((match) => match[1]);
  return [...new Set(links)];
}

export async function findPdfLink() {
  const page = await getText(DATABANKA_PAGE);
  if (!page.ok) {
    return { ok: false, unverified: true, reason: `could not fetch the databanka page: ${page.reason ?? 'missing'}` };
  }

  const unique = extractPdfLinks(page.text);

  if (unique.length === 0) {
    return { ok: false, unverified: true, reason: 'no question-bank PDF link found on the page; its structure may have changed' };
  }
  if (unique.length > 1) {
    return { ok: false, unverified: true, reason: `expected one PDF link, found ${unique.length}: ${unique.join(', ')}` };
  }

  return { ok: true, url: unique[0] };
}

/**
 * Pulls the edition marker out of the PDF's title page, e.g.
 * "Vydání desáté (elektronické), upravené, Praha, 2026 Aktualizováno 5. 1. 2026".
 *
 * This is preferred over hashing the file: a hash changes on any trivial re-save and says
 * nothing about what moved, whereas the edition line is what a human would look at.
 */
export async function readPdfMetadata(url) {
  const file = await getBytes(url, { expect: 'pdf' });
  if (!file.ok) return file;

  let text;
  try {
    const pdf = await getDocumentProxy(file.bytes);
    ({ text } = await extractText(pdf, { mergePages: true }));
  } catch (error) {
    return { ok: false, unverified: true, reason: `could not extract text from the PDF: ${error.message}` };
  }

  const normalised = text.replace(/\s+/g, ' ');
  const edition = normalised.match(/Vydání[^©]*?Aktualizováno\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/);

  if (!edition) {
    return { ok: false, unverified: true, reason: 'no "Vydání ... Aktualizováno" line found; the PDF layout may have changed' };
  }

  return {
    ok: true,
    edition: edition[0].trim(),
    updatedAt: edition[1].replace(/\s+/g, ' ').trim(),
    // 30 topics of 10 questions each. A change here means the bank was restructured.
    topicCount: (normalised.match(/SPRÁVNÉ ŘEŠENÍ/g) ?? []).length,
    sha256: sha256(file.bytes),
    bytes: file.bytes.length,
  };
}
