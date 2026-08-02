import { describe, expect, it } from 'vitest';
import { extractPdfLinks, parseEdition } from './parse.ts';

const CURRENT = 'https://cestina-pro-cizince.cz/obcanstvi/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf';

describe('extractPdfLinks', () => {
  it('finds the question bank among other links', () => {
    const html = `<a href="/obcanstvi/">x</a><a href="${CURRENT}">bank</a><a href="https://e.com/o.pdf">y</a>`;
    expect(extractPdfLinks(html)).toEqual([CURRENT]);
  });

  it('ignores unrelated PDFs such as the application form', () => {
    expect(extractPdfLinks('<a href="/uploads/sssz-formular.pdf">f</a>')).toEqual([]);
  });

  it('returns nothing when the page has no question bank', () => {
    expect(extractPdfLinks('<a href="/obcanstvi/">x</a>')).toEqual([]);
  });

  it('returns nothing for an empty or unparseable page', () => {
    expect(extractPdfLinks('')).toEqual([]);
  });

  it('does not repeat a link that appears twice', () => {
    expect(extractPdfLinks(`<a href="${CURRENT}">a</a><a href="${CURRENT}">b</a>`)).toEqual([CURRENT]);
  });

  it('reports every distinct link so an ambiguous page can be rejected', () => {
    const older = 'https://cestina-pro-cizince.cz/uploads/2025/01/OBC_databanka_250101.pdf';
    expect(extractPdfLinks(`<a href="${CURRENT}">a</a><a href="${older}">b</a>`)).toHaveLength(2);
  });
});

describe('parseEdition', () => {
  const titlePage = 'Národní pedagogický institut České republiky Vydání desáté '
    + '(elektronické), upravené, Praha, 2026 Aktualizováno 5. 1. 2026 © NPI ČR, 2026';

  it('reads the edition and the update date', () => {
    const parsed = parseEdition(titlePage);
    expect(parsed?.edition).toContain('Vydání desáté');
    expect(parsed?.updatedAt).toBe('5. 1. 2026');
  });

  it('survives the erratic spacing PDF extraction produces', () => {
    const messy = 'Vydání  desáté  , Praha,  2026   Aktualizováno  5.  1.  2026 ©';
    expect(parseEdition(messy)?.updatedAt).toBe('5. 1. 2026');
  });

  it('counts the answer-key blocks, one per topic', () => {
    const text = `${titlePage} ${'SPRÁVNÉ ŘEŠENÍ: 1C, 2A '.repeat(30)}`;
    expect(parseEdition(text)?.topicCount).toBe(30);
  });

  it('returns null when the marker is absent, so the caller reports "could not verify"', () => {
    expect(parseEdition('some other document entirely')).toBeNull();
  });

  it('returns null for empty text rather than inventing an edition', () => {
    expect(parseEdition('')).toBeNull();
  });

  // Verbatim from real editions. 2021 and 2023 are both "Vydání osmé" — only the
  // Aktualizováno date distinguishes them. Comparing the whole
  // line covers both.
  describe.each([
    ['2021', 'Vydání osmé (elektronické), Praha, 2021 Aktualizováno 13. 12. 2021 © NPI ČR', '13. 12. 2021'],
    ['2023', 'Vydání osmé (elektronické), Praha, 2023 Aktualizováno 11. 12. 2023 © NPI ČR', '11. 12. 2023'],
    ['2026', 'Vydání desáté (elektronické), upravené, Praha, 2026 Aktualizováno 5. 1. 2026 © NPI ČR', '5. 1. 2026'],
  ])('the %s edition', (_year, line, expected) => {
    it('yields its update date', () => {
      expect(parseEdition(line)?.updatedAt).toBe(expected);
    });
  });
});
