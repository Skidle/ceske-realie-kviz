import { describe, expect, it } from 'vitest';
import { sections } from './sections.ts';

const bodies = (text: string, marker: RegExp) => sections(text, marker).map((s) => s.body);

describe('sections', () => {
  it('gives what follows each marker, up to the next one', () => {
    expect(bodies('A) one B) two C) three', /[A-C]\)/g)).toEqual([' one ', ' two ', ' three']);
  });

  it('runs the last section to the end of the text', () => {
    expect(bodies('1. first 2. second', /\d\./g)).toEqual([' first ', ' second']);
  });

  it('ignores anything before the first marker', () => {
    expect(bodies('preamble 1. first', /\d\./g)).toEqual([' first']);
  });

  it('finds nothing when the marker never matches', () => {
    expect(sections('no markers here', /\d\./g)).toEqual([]);
  });

  it('hands back the marker, so its capture groups can be read', () => {
    const [first] = sections('12. TOPIC\nbody', /^(\d{1,2})\.\s+(\w+)$/gm);

    expect(first.match[1]).toBe('12');
    expect(first.match[2]).toBe('TOPIC');
  });

  // The marker is consumed, not included. An earlier version of this arithmetic carried a
  // `- 2` to back over a marker it had already stepped past.
  it('leaves no part of the marker in the body', () => {
    expect(bodies('A) one B) two', /[A-D]\)/g)).not.toContain(expect.stringContaining(')'));
  });

  it('handles markers that touch, with nothing between them', () => {
    expect(bodies('A)B)C)', /[A-C]\)/g)).toEqual(['', '', '']);
  });

  it('keeps sections in the order they appear, not the order of the alternatives', () => {
    // The PDF's two columns can emit A, B, D, C. Position is what this returns; the caller
    // decides what to do about the letters.
    const found = sections('A) a B) b D) d C) c', /([A-D])\)/g);

    expect(found.map((s) => s.match[1])).toEqual(['A', 'B', 'D', 'C']);
  });
});
