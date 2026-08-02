import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { baselinePath, readBaseline, writeBaseline } from './baseline.ts';
import type { Baseline } from './baseline.ts';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn(), writeFile: vi.fn() }));

const read = vi.mocked(readFile);
const write = vi.mocked(writeFile);

const baseline: Baseline = {
  source: {
    pdfUrl: 'https://example.test/bank.pdf', edition: '5. 1. 2026', updatedAt: '2026-01-05', topicCount: 30,
  },
};

const onDisk = (value: unknown) => read.mockResolvedValue(JSON.stringify(value) as never);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readBaseline', () => {
  it('reads the file next to the package', async () => {
    onDisk(baseline);
    await readBaseline();

    expect(read).toHaveBeenCalledWith(baselinePath, 'utf8');
    expect(baselinePath).toMatch(/baseline\.json$/);
  });

  it('returns what was recorded', async () => {
    onDisk(baseline);

    expect(await readBaseline()).toEqual(baseline);
  });

  // All of these throw on purpose; the caller turns that into exit 2.
  it('throws when the file is not there', async () => {
    read.mockRejectedValue(new Error('ENOENT: no such file or directory') as never);

    await expect(readBaseline()).rejects.toThrow('ENOENT');
  });

  it('throws when the file is not valid JSON', async () => {
    read.mockResolvedValue('{ truncated' as never);

    await expect(readBaseline()).rejects.toThrow();
  });

  it('throws when the source section is missing', async () => {
    onDisk({ checkedAt: '2026-08-02T00:00:00.000Z' });

    await expect(readBaseline()).rejects.toThrow('missing its source section');
  });

  it('throws when the source has no PDF URL', async () => {
    onDisk({ source: { edition: '5. 1. 2026' } });

    await expect(readBaseline()).rejects.toThrow('missing its source section');
  });
});

describe('writeBaseline', () => {
  it('writes indented JSON with a trailing newline, so diffs stay readable', async () => {
    await writeBaseline(baseline);

    const [path, contents] = write.mock.calls[0];
    expect(path).toBe(baselinePath);
    expect(contents).toBe(`${JSON.stringify(baseline, null, 2)}\n`);
  });

  it('round-trips through readBaseline', async () => {
    await writeBaseline(baseline);
    read.mockResolvedValue(write.mock.calls[0][1] as never);

    expect(await readBaseline()).toEqual(baseline);
  });
});
