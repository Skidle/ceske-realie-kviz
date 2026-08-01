import { describe, expect, it } from 'vitest';
import { collapse, normaliseDate, stripPageNumbers } from './normalise.ts';

describe('normaliseDate', () => {
  // All taken verbatim from the 2026 edition. The layout puts spaces inside the numbers.
  it.each([
    ['1 6. 1 2. 2024', '16.12.2024'],
    ['7 . 12. 2015', '07.12.2015'],
    ['8. 1 2. 2014', '08.12.2014'],
    ['20. 11. 2013', '20.11.2013'],
    ['1 5. 1 2. 2025', '15.12.2025'],
  ])('reads %s as %s', (raw, expected) => {
    expect(normaliseDate(raw)).toBe(expected);
  });

  it('returns nothing rather than guessing at something unrecognisable', () => {
    expect(normaliseDate('někdy v prosinci')).toBeUndefined();
    expect(normaliseDate('')).toBeUndefined();
  });
});

describe('stripPageNumbers', () => {
  it('drops a number printed alone on a line', () => {
    expect(stripPageNumbers('konec věty\n8\n1. Další otázka')).not.toMatch(/^8$/m);
  });

  it('keeps a number that is part of a line', () => {
    expect(stripPageNumbers('8. V České republice')).toContain('8. V České republice');
  });
});

describe('collapse', () => {
  it('joins a sentence broken across lines by the layout', () => {
    expect(collapse('Na kterém obrázku\n  jsou Pražský   hrad')).toBe('Na kterém obrázku jsou Pražský hrad');
  });
});
