import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { appendFile } from 'node:fs/promises';
import { runCli } from './cli.ts';
import { readBaseline, writeBaseline } from './baseline.ts';
import { checkImages, checkSource, readSource } from './check.ts';
import { getBytes, headFacts } from './fetch.ts';
import { hotlinkedImages } from './images.ts';
import { EXIT } from './verdict.ts';
import type { Baseline } from './baseline.ts';
import type { CheckResult } from './types.ts';

vi.mock('node:fs/promises', () => ({ appendFile: vi.fn() }));
vi.mock('./baseline.ts', () => ({
  readBaseline: vi.fn(), writeBaseline: vi.fn(), baselinePath: '/repo/baseline.json',
}));
vi.mock('./check.ts', () => ({ checkSource: vi.fn(), checkImages: vi.fn(), readSource: vi.fn() }));
vi.mock('./fetch.ts', () => ({ headFacts: vi.fn(), getBytes: vi.fn(), sha256: () => 'a'.repeat(64) }));
vi.mock('./images.ts', () => ({ hotlinkedImages: vi.fn() }));

const read = vi.mocked(readBaseline);
const write = vi.mocked(writeBaseline);
const source = vi.mocked(checkSource);
const images = vi.mocked(checkImages);
const sourceState = vi.mocked(readSource);
const head = vi.mocked(headFacts);
const bytes = vi.mocked(getBytes);
const hotlinked = vi.mocked(hotlinkedImages);

const ok = (name: string): CheckResult => ({ name, state: 'unchanged' });
const baseline = { source: {}, images: {} } as unknown as Baseline;
const IMAGE = 'https://example.test/1alt1.jpg';
const use = { question: 'Na kterém obrázku?', role: 'answer 1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  delete process.env.GITHUB_STEP_SUMMARY;

  read.mockResolvedValue(baseline);
  source.mockResolvedValue([ok('question bank')]);
  images.mockResolvedValue([ok('1alt1.jpg')]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checking', () => {
  it('exits 0 when everything was checked and nothing moved', async () => {
    expect(await runCli(['node', 'main.ts'])).toBe(EXIT.verified);
  });

  it('exits 1 when the source changed', async () => {
    source.mockResolvedValue([{ name: 'question bank', state: 'changed', detail: 'new edition' }]);

    expect(await runCli([])).toBe(EXIT.drift);
  });

  it('exits 2 when an item could not be checked', async () => {
    images.mockResolvedValue([{ name: '1alt1.jpg', state: 'unverified', detail: 'HTTP 429' }]);

    expect(await runCli([])).toBe(EXIT.unverified);
  });

  // The failure mode the exit codes exist to prevent. A run that could not read its own
  // baseline knows nothing, and must not report the same code as a clean run.
  it('exits 2, not 0, when the baseline cannot be read', async () => {
    read.mockRejectedValue(new Error('ENOENT: no such file'));

    expect(await runCli([])).toBe(EXIT.unverified);
    expect(images).not.toHaveBeenCalled();
  });

  it('says why the baseline could not be read', async () => {
    read.mockRejectedValue(new Error('ENOENT: no such file'));
    await runCli([]);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ENOENT: no such file'));
  });

  it('prints the tally on a clean run', async () => {
    await runCli([]);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Checked 2: 2 unchanged'));
  });

  it('names the item when there is a problem', async () => {
    images.mockResolvedValue([{ name: '1alt1.jpg', state: 'missing', detail: 'HTTP 404' }]);
    await runCli([]);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MISSING     1alt1.jpg  HTTP 404'));
  });

  it('writes the report to the job summary when running in Actions', async () => {
    process.env.GITHUB_STEP_SUMMARY = '/github/summary.md';
    await runCli([]);

    expect(vi.mocked(appendFile).mock.calls[0][0]).toBe('/github/summary.md');
    expect(vi.mocked(appendFile).mock.calls[0][1]).toContain('## Monitor');
  });

  it('does not try to write a summary when running locally', async () => {
    await runCli([]);

    expect(appendFile).not.toHaveBeenCalled();
  });
});

describe('recording', () => {
  beforeEach(() => {
    read.mockResolvedValue({ source: {}, images: {} } as unknown as Baseline);
    sourceState.mockResolvedValue({ ok: true, source: { pdfUrl: 'https://example.test/bank.pdf' } as never });
    hotlinked.mockReturnValue(new Map([[IMAGE, use]]));
    head.mockResolvedValue({ ok: true, value: { etag: '"abc"', lastModified: null, contentLength: '10' } });
    bytes.mockResolvedValue({ ok: true, value: new Uint8Array([1, 2, 3]) });
  });

  it('is chosen by --record', async () => {
    await runCli(['node', 'main.ts', '--record']);

    expect(write).toHaveBeenCalled();
    expect(images).not.toHaveBeenCalled();
  });

  it('records what it read, keyed by URL', async () => {
    await runCli(['--record']);

    expect(write.mock.calls[0][0].images[IMAGE]).toMatchObject({
      etag: '"abc"', bytes: 3, sha256: 'a'.repeat(64), usedBy: use,
    });
  });

  // Acknowledging a bad image is a human decision. A re-record wiping it would quietly
  // turn a tracked problem back into an untracked one.
  it('preserves an existing knownBad note', async () => {
    const knownBad = { reason: 'shows the Municipal House', since: '2025-12-15' };
    read.mockResolvedValue({ source: {}, images: { [IMAGE]: { knownBad } } } as unknown as Baseline);

    await runCli(['--record']);

    expect(write.mock.calls[0][0].images[IMAGE].knownBad).toEqual(knownBad);
  });

  it('refuses to write the first baseline itself', async () => {
    read.mockRejectedValue(new Error('ENOENT'));

    expect(await runCli(['--record'])).toBe(EXIT.unverified);
    expect(write).not.toHaveBeenCalled();
  });

  it('refuses to record anything when the source could not be read', async () => {
    sourceState.mockResolvedValue({ ok: false, reason: 'the databanka page is gone' });

    expect(await runCli(['--record'])).toBe(EXIT.unverified);
    expect(write).not.toHaveBeenCalled();
  });

  // An unreadable image must not drop out of the baseline: doing so would make the next
  // run report "no baseline recorded" instead of noticing it had gone.
  it('keeps a previous record when an image cannot be read, and exits 2', async () => {
    head.mockResolvedValue({ ok: false, unverified: 'HTTP 500' });
    const previous = { sha256: 'old', bytes: 99 };
    read.mockResolvedValue({ source: {}, images: { [IMAGE]: previous } } as unknown as Baseline);

    expect(await runCli(['--record'])).toBe(EXIT.unverified);
    expect(write.mock.calls[0][0].images[IMAGE]).toEqual({ ...previous, usedBy: use });
  });

  it('exits 0 when every image was read', async () => {
    expect(await runCli(['--record'])).toBe(EXIT.verified);
  });
});
