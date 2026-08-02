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
  images: {},
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

  // Every one of these throws on purpose. A baseline that cannot be read means nothing can
  // be compared, and the caller turns that into exit code 2 — the one thing this tool must
  // never do is let "I could not check" pass as "nothing changed".
  it('throws when the file is not there', async () => {
    read.mockRejectedValue(new Error('ENOENT: no such file or directory') as never);

    await expect(readBaseline()).rejects.toThrow('ENOENT');
  });

  it('throws when the file is not valid JSON', async () => {
    read.mockResolvedValue('{ truncated' as never);

    await expect(readBaseline()).rejects.toThrow();
  });

  it('throws when the source section is missing', async () => {
    onDisk({ images: {} });

    await expect(readBaseline()).rejects.toThrow('missing its source or images section');
  });

  it('throws when the source has no PDF URL', async () => {
    onDisk({ source: { edition: '5. 1. 2026' }, images: {} });

    await expect(readBaseline()).rejects.toThrow('missing its source or images section');
  });

  it('throws when the images section is missing', async () => {
    onDisk({ source: baseline.source });

    await expect(readBaseline()).rejects.toThrow('missing its source or images section');
  });

  // An empty images map is a legitimate state, and `{}` is falsy-adjacent enough to be
  // worth pinning: it must not be mistaken for a missing section.
  it('accepts a baseline with no images recorded yet', async () => {
    onDisk({ source: baseline.source, images: {} });

    expect((await readBaseline()).images).toEqual({});
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
