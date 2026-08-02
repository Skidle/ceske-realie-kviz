import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { checkImage, checkImages, readSource } from './check.ts';
import { getBytes, getText, headFacts } from './fetch.ts';
import type { Baseline } from './baseline.ts';
import type { ImageRecord } from './types.ts';

vi.mock('./fetch.ts', async (importActual) => ({
  ...await importActual<typeof import('./fetch.ts')>(),
  headFacts: vi.fn(),
  getBytes: vi.fn(),
  getText: vi.fn(),
}));

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(async () => ({})),
  extractText: vi.fn(async () => ({ text: pdfText })),
}));

let pdfText = '';

const head = vi.mocked(headFacts);
const bytes = vi.mocked(getBytes);
const text = vi.mocked(getText);

const URL_1 = 'https://cestina-pro-cizince.cz/wp-content/uploads/1alt1.jpg';

/** The bytes behind this hash; `getBytes` is mocked, so the content itself never matters. */
const CONTENT = new TextEncoder().encode('image bytes');
const CONTENT_SHA = 'd5bd5d1b1d5d8a1e08d1e26bd0e7a1a3ff4dbb6b4e0e3f7b8fbd5c0a2a3d4e5f';

const record: ImageRecord = {
  etag: '"abc"',
  lastModified: 'Mon, 15 Dec 2025 11:50:36 GMT',
  contentLength: '146307',
  sha256: CONTENT_SHA,
  bytes: 146307,
  usedBy: { question: 'Na kterém obrázku je Karlštejn?', role: 'answer 3' },
};

const sameFacts = { etag: '"abc"', lastModified: record.lastModified, contentLength: '146307' };
const movedFacts = { etag: '"different"', lastModified: 'Tue, 16 Dec 2025 00:00:00 GMT', contentLength: '999' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('checkImage', () => {
  it('refuses to judge an image it has no baseline for', async () => {
    const result = await checkImage(URL_1, undefined);

    expect(result).toEqual({ name: '1alt1.jpg', state: 'unverified', detail: 'no baseline recorded' });
    expect(head).not.toHaveBeenCalled();
  });

  // The saving that lets a monthly run stay polite: forty HEADs and no downloads.
  it('does not download when the validators still match', async () => {
    head.mockResolvedValue({ ok: true, value: sameFacts });

    expect(await checkImage(URL_1, record)).toMatchObject({ state: 'unchanged' });
    expect(bytes).not.toHaveBeenCalled();
  });

  it('downloads and compares content when the validators have moved', async () => {
    head.mockResolvedValue({ ok: true, value: movedFacts });
    bytes.mockResolvedValue({ ok: true, value: CONTENT });

    expect(await checkImage(URL_1, record)).toMatchObject({ state: 'changed' });
    expect(bytes).toHaveBeenCalledWith(URL_1, 'jpeg');
  });

  it('reports unchanged when the validators moved but the bytes did not', async () => {
    head.mockResolvedValue({ ok: true, value: movedFacts });
    bytes.mockResolvedValue({ ok: true, value: CONTENT });

    const sameContent = { ...record, sha256: await sha(CONTENT) };
    expect(await checkImage(URL_1, sameContent)).toMatchObject({ state: 'unchanged' });
  });

  it('reports a 404 as missing', async () => {
    head.mockResolvedValue({ ok: false, missing: true });

    expect(await checkImage(URL_1, record)).toMatchObject({ state: 'missing', detail: 'HTTP 404' });
  });

  // The bug this guards: the baseline recorded the already-wrong file, so every run
  // afterwards said "unchanged" about an image that was visibly the wrong photograph.
  it('keeps surfacing a known-bad image even when nothing moved', async () => {
    head.mockResolvedValue({ ok: true, value: sameFacts });
    const knownBad = { ...record, knownBad: { reason: 'shows the Municipal House, not Karlštejn', since: '2025-12-15' } };

    expect(await checkImage(URL_1, knownBad)).toMatchObject({
      state: 'known',
      detail: 'shows the Municipal House, not Karlštejn',
    });
  });

  it('reports a known-bad image that 404s as known, not as new drift', async () => {
    head.mockResolvedValue({ ok: false, missing: true });
    const knownBad = { ...record, knownBad: { reason: 'deleted upstream', since: '2025-12-15' } };

    expect(await checkImage(URL_1, knownBad)).toMatchObject({ state: 'known', detail: 'deleted upstream' });
  });

  it('says it could not check when the HEAD failed', async () => {
    head.mockResolvedValue({ ok: false, unverified: 'HTTP 429' });

    expect(await checkImage(URL_1, record)).toMatchObject({ state: 'unverified', detail: 'HTTP 429' });
  });

  it('says it could not check when the download failed', async () => {
    head.mockResolvedValue({ ok: true, value: movedFacts });
    bytes.mockResolvedValue({ ok: false, unverified: 'expected jpeg, got text/html' });

    expect(await checkImage(URL_1, record))
      .toMatchObject({ state: 'unverified', detail: 'expected jpeg, got text/html' });
  });

  it('carries the question through, so a report can name it', async () => {
    head.mockResolvedValue({ ok: true, value: sameFacts });

    expect((await checkImage(URL_1, record)).usedBy).toEqual(record.usedBy);
  });
});

describe('checkImages', () => {
  it('checks every image in the baseline', async () => {
    head.mockResolvedValue({ ok: true, value: sameFacts });
    const baseline = { images: { [URL_1]: record, 'https://x.test/2alt1.jpg': record } } as unknown as Baseline;

    const results = await checkImages(baseline);

    expect(results.map((r) => r.name)).toEqual(['1alt1.jpg', '2alt1.jpg']);
  });

  // Requests go one at a time so the monthly run costs the source site about what one
  // visitor does.
  it('requests them one at a time', async () => {
    let inFlight = 0;
    let overlapped = false;
    head.mockImplementation(async () => {
      inFlight += 1;
      overlapped ||= inFlight > 1;
      await Promise.resolve();
      inFlight -= 1;
      return { ok: true, value: sameFacts };
    });
    const baseline = { images: { a: record, b: record, c: record } } as unknown as Baseline;

    await checkImages(baseline);

    expect(overlapped).toBe(false);
  });
});

describe('readSource', () => {
  const page = '<a href="https://cestina-pro-cizince.cz/wp-content/uploads/2026/01/OBC_databanka_testovychuloh_260105.pdf">bank</a>';

  beforeEach(() => {
    pdfText = 'Vydání 5. 1. 2026 Aktualizováno 5. 1. 2026';
    text.mockResolvedValue({ ok: true, value: page });
    bytes.mockResolvedValue({ ok: true, value: CONTENT });
  });

  it('reads the edition off the PDF the page links to', async () => {
    const result = await readSource();

    expect(result).toMatchObject({ ok: true });
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

    expect(await readSource()).toMatchObject({ ok: false, reason: expect.stringContaining('no question-bank PDF link') });
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

async function sha(input: Uint8Array): Promise<string> {
  const { sha256 } = await vi.importActual<typeof import('./fetch.ts')>('./fetch.ts');
  return sha256(input);
}
