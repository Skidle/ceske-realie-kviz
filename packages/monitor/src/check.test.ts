import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { readSource } from './check.ts';
import { getBytes, getText } from './fetch.ts';

vi.mock('./fetch.ts', async (importActual) => ({
  ...await importActual<typeof import('./fetch.ts')>(),
  getBytes: vi.fn(),
  getText: vi.fn(),
}));

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(async () => ({})),
  extractText: vi.fn(async () => ({ text: pdfText })),
}));

let pdfText = '';

const bytes = vi.mocked(getBytes);
const text = vi.mocked(getText);

const PDF = new TextEncoder().encode('%PDF-1.4');

describe('readSource', () => {
  const page = '<a href="https://cestina-pro-cizince.cz/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf">bank</a>';

  beforeEach(() => {
    vi.clearAllMocks();
    pdfText = 'Vydání 5. 1. 2026 Aktualizováno 5. 1. 2026';
    text.mockResolvedValue({ ok: true, value: page });
    bytes.mockResolvedValue({ ok: true, value: PDF });
  });

  it('reads the edition off the PDF the page links to', async () => {
    expect(await readSource()).toMatchObject({ ok: true });
  });

  it('says the page is gone rather than that the bank changed', async () => {
    text.mockResolvedValue({ ok: false, missing: true });

    expect(await readSource()).toEqual({ ok: false, reason: 'the databanka page is gone' });
  });

  it('passes a failed page fetch through as a failure to check', async () => {
    text.mockResolvedValue({ ok: false, unverified: 'HTTP 502' });

    expect(await readSource()).toEqual({ ok: false, reason: 'HTTP 502' });
  });

  // Silence here would be the dangerous outcome: no link found reading as nothing changed.
  it('refuses when the page has no PDF link at all', async () => {
    text.mockResolvedValue({ ok: true, value: '<p>nothing here</p>' });

    expect(await readSource())
      .toMatchObject({ ok: false, reason: expect.stringContaining('no question-bank PDF link') });
  });

  it('refuses when the page has more than one, rather than guessing', async () => {
    text.mockResolvedValue({ ok: true, value: `${page}${page.replace('260105', '250105')}` });

    expect(await readSource()).toEqual({ ok: false, reason: 'expected one PDF link, found 2' });
  });

  it('reports a PDF that will not parse as a failure to check, never as a change', async () => {
    const { extractText } = await import('unpdf');
    vi.mocked(extractText).mockRejectedValueOnce(new Error('Invalid PDF structure'));

    expect(await readSource())
      .toEqual({ ok: false, reason: 'could not extract text: Invalid PDF structure' });
  });

  it('refuses when the edition line is missing', async () => {
    pdfText = 'a PDF with no edition line';

    expect(await readSource()).toMatchObject({ ok: false, reason: expect.stringContaining('Vydání') });
  });
});
