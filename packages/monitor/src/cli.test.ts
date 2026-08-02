import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { appendFile } from 'node:fs/promises';
import { runCli } from './cli.ts';
import { readBaseline, writeBaseline } from './baseline.ts';
import { checkSource, readSource } from './check.ts';
import { EXIT } from './verdict.ts';
import type { Baseline } from './baseline.ts';
import type { CheckResult } from './types.ts';

vi.mock('node:fs/promises', () => ({ appendFile: vi.fn() }));
vi.mock('./baseline.ts', () => ({
  readBaseline: vi.fn(), writeBaseline: vi.fn(), baselinePath: '/repo/baseline.json',
}));
vi.mock('./check.ts', () => ({ checkSource: vi.fn(), readSource: vi.fn() }));

const read = vi.mocked(readBaseline);
const write = vi.mocked(writeBaseline);
const source = vi.mocked(checkSource);
const sourceState = vi.mocked(readSource);

const baseline = { source: { pdfUrl: 'https://example.test/bank.pdf' } } as unknown as Baseline;
const ok = (name: string): CheckResult => ({ name, state: 'unchanged' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  delete process.env.GITHUB_STEP_SUMMARY;

  read.mockResolvedValue(baseline);
  source.mockResolvedValue([ok('pdf link'), ok('edition'), ok('topics')]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checking', () => {
  it('exits 0 when everything was checked and nothing moved', async () => {
    expect(await runCli(['node', 'main.ts'])).toBe(EXIT.verified);
  });

  it('exits 1 when the source changed', async () => {
    source.mockResolvedValue([{ name: 'edition', state: 'changed', detail: 'new edition' }]);

    expect(await runCli([])).toBe(EXIT.drift);
  });

  it('exits 2 when the source could not be read', async () => {
    source.mockResolvedValue([{ name: 'question bank', state: 'unverified', detail: 'HTTP 502' }]);

    expect(await runCli([])).toBe(EXIT.unverified);
  });

  // A run that could not read its baseline knows nothing, and must not exit like a clean one.
  it('exits 2, not 0, when the baseline cannot be read', async () => {
    read.mockRejectedValue(new Error('ENOENT: no such file'));

    expect(await runCli([])).toBe(EXIT.unverified);
    expect(source).not.toHaveBeenCalled();
  });

  it('says why the baseline could not be read', async () => {
    read.mockRejectedValue(new Error('ENOENT: no such file'));
    await runCli([]);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ENOENT: no such file'));
  });

  it('prints the tally on a clean run', async () => {
    await runCli([]);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Checked 3: 3 unchanged'));
  });

  it('names the item when there is a problem', async () => {
    source.mockResolvedValue([{ name: 'edition', state: 'changed', detail: '2026 -> 2027' }]);
    await runCli([]);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('CHANGED     edition  2026 -> 2027'));
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
    sourceState.mockResolvedValue({ ok: true, source: { pdfUrl: 'https://example.test/bank.pdf' } as never });
  });

  it('is chosen by --record', async () => {
    await runCli(['node', 'main.ts', '--record']);

    expect(write).toHaveBeenCalled();
    expect(source).not.toHaveBeenCalled();
  });

  it('records what it read, with the time it read it', async () => {
    await runCli(['--record']);

    expect(write.mock.calls[0][0]).toMatchObject({
      source: { pdfUrl: 'https://example.test/bank.pdf' },
      checkedAt: expect.any(String),
    });
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

  it('exits 0 when the source was recorded', async () => {
    expect(await runCli(['--record'])).toBe(EXIT.verified);
  });
});
