import { describe, expect, it } from 'vitest';
import { extractPdfLinks } from './source.mjs';

// The monitor must never treat "I could not find the link" as "nothing changed". These
// cover the page-structure failures that cannot be reproduced against the live site.

const page = (body) => `<html><body>${body}</body></html>`;
const CURRENT = 'https://cestina-pro-cizince.cz/obcanstvi/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf';

describe('extractPdfLinks', () => {
  it('finds the question-bank PDF among other links', () => {
    const html = page(`
      <a href="/obcanstvi/">Občanství</a>
      <a href="${CURRENT}">Databanka testových úloh</a>
      <a href="https://example.com/other.pdf">Something else</a>
    `);

    expect(extractPdfLinks(html)).toEqual([CURRENT]);
  });

  it('returns nothing when the page has no question-bank PDF', () => {
    expect(extractPdfLinks(page('<a href="/obcanstvi/">Občanství</a>'))).toEqual([]);
  });

  it('returns nothing when the page could not be parsed as expected', () => {
    expect(extractPdfLinks('')).toEqual([]);
  });

  it('reports every distinct link when more than one is present', () => {
    const older = 'https://cestina-pro-cizince.cz/uploads/2025/01/OBC_databanka_250101.pdf';
    const html = page(`<a href="${CURRENT}">new</a><a href="${older}">old</a>`);

    expect(extractPdfLinks(html)).toHaveLength(2);
  });

  it('does not report the same link twice when it appears more than once', () => {
    const html = page(`<a href="${CURRENT}">a</a><a href="${CURRENT}">b</a>`);

    expect(extractPdfLinks(html)).toEqual([CURRENT]);
  });

  it('ignores unrelated PDFs such as the application form', () => {
    const html = page('<a href="/wp-content/uploads/2024/05/sssz-formular.pdf">Formulář</a>');

    expect(extractPdfLinks(html)).toEqual([]);
  });
});
