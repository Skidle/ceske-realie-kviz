import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { hotlinkedImages } from './images.ts';
import type { Baseline } from './baseline.ts';

const baseline: Baseline = JSON.parse(
  readFileSync(fileURLToPath(new URL('../baseline.json', import.meta.url)), 'utf8'),
);

describe('hotlinkedImages', () => {
  it('finds the images the questions still load from the source site', () => {
    expect(hotlinkedImages().size).toBeGreaterThan(0);
  });

  it('records which question and which answer each image belongs to', () => {
    const [, use] = [...hotlinkedImages()].find(([url]) => url.includes('17alt1')) ?? [];

    expect(use?.question).toContain('Národní divadlo');
    expect(use?.role).toBe('answer 1');
  });

  it('labels a question image differently from an answer', () => {
    const roles = new Set([...hotlinkedImages().values()].map((use) => use.role));

    expect(roles).toContain('question image');
    expect(roles).toContain('answer 1');
  });
});

// Guards against the baseline going stale: an image added to or removed from the
// questions must be recorded, or the monitor would silently stop covering it.
describe('baseline.json', () => {
  it('covers exactly the images the questions use', () => {
    expect(new Set(Object.keys(baseline.images))).toEqual(new Set(hotlinkedImages().keys()));
  });

  it('names the question behind every image', () => {
    const unnamed = Object.entries(baseline.images).filter(([, record]) => !record.usedBy);

    expect(unnamed).toEqual([]);
  });
});
