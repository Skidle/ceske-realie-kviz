import { describe, expect, it } from 'vitest';
import { parseAnswerKey, parseQuestions, parseTopics } from './parse.ts';
import type { Topic } from './types.ts';

const topic = (body: string): Topic => ({ number: 1, title: 'TEST', body });

describe('parseAnswerKey', () => {
  it('reads a well-formed key', () => {
    const key = parseAnswerKey('SPRÁVNÉ ŘEŠENÍ: 1C, 2C, 3D, 4B, 5A, 6C, 7A, 8B, 9B, 10B');

    expect(key[1]).toBe('C');
    expect(key[10]).toBe('B');
    expect(Object.keys(key)).toHaveLength(10);
  });

  // Verbatim from topic 2 of the 2026 edition, which prints "8D 9C" without a comma.
  it('survives a missing separator', () => {
    const key = parseAnswerKey('SPRÁVNÉ ŘEŠENÍ: 1A, 2A, 3B, 4D, 5B, 6A, 7C, 8D 9C, 10B');

    expect(key[8]).toBe('D');
    expect(key[9]).toBe('C');
    expect(Object.keys(key)).toHaveLength(10);
  });

  // Also verbatim: the layout sometimes splits the number from its letter.
  it('survives a space between the number and the letter', () => {
    expect(parseAnswerKey('SPRÁVNÉ ŘEŠENÍ: 1 C, 2A')[1]).toBe('C');
  });

  it('returns nothing when there is no key, rather than inventing one', () => {
    expect(parseAnswerKey('a topic with no answers printed')).toEqual({});
  });
});

describe('parseQuestions', () => {
  it('reads the question text apart from its alternatives', () => {
    const questions = parseQuestions(topic(
      '1. Jakou nejvyšší hodnotu má platná česká bankovka? A) 500 korun. B) 1 000 korun. '
      + 'C) 2 000 korun. D) 5 000 korun.\nDatum aktualizace testové úlohy: 8. 1 2. 2014',
    ));

    expect(questions).toHaveLength(1);
    expect(questions[0].text).toBe('Jakou nejvyšší hodnotu má platná česká bankovka?');
    expect(questions[0].answers.A).toBe('500 korun.');
    expect(questions[0].answers.D).toBe('5 000 korun.');
  });

  // The PDF is laid out in columns, so the extracted text sometimes runs A, B, D, C.
  // Reading them positionally would silently swap two answers.
  it('keys alternatives by their letter, not by the order they appear', () => {
    const [question] = parseQuestions(topic(
      '1. Co musí řidič dodržovat? A) Zapnuté pásy. B) Zavřená okna.\n\n'
      + 'D) Zamčené dveře. C) Reflexní vesty.\nDatum aktualizace testové úlohy: 1 4. 1 2. 2020',
    ));

    expect(question.answers.C).toBe('Reflexní vesty.');
    expect(question.answers.D).toBe('Zamčené dveře.');
  });

  it('keeps the date out of the last alternative', () => {
    const [question] = parseQuestions(topic(
      '1. Otázka? A) Jedna. B) Dvě. C) Tři. D) Čtyři.\n'
      + 'Datum aktualizace testové úlohy: 1 1. 1 2. 2017',
    ));

    expect(question.answers.D).toBe('Čtyři.');
    expect(question.updatedAt).toBe('11.12.2017');
  });

  // An image question prints the letters with nothing after them: the text alone cannot
  // say which picture is which, so it is flagged for the image extraction to handle.
  it('flags a question whose alternatives are pictures', () => {
    const [question] = parseQuestions(topic(
      '4. Na kterém obrázku je hrad Karlštejn?\n\nA)\n\nB)\n\nC)\n\nD)\n'
      + 'Datum aktualizace testové úlohy: 1 2. 1 2. 2022',
    ));

    expect(question.isPhoto).toBe(true);
    expect(question.text).toBe('Na kterém obrázku je hrad Karlštejn?');
  });

  it('does not treat a text question as a picture one', () => {
    const [question] = parseQuestions(topic('1. Otázka? A) Ano. B) Ne. C) Snad. D) Nikdy.'));

    expect(question.isPhoto).toBe(false);
  });

  it('reads a question with no printed date', () => {
    const [question] = parseQuestions(topic('1. Otázka? A) Ano. B) Ne. C) Snad. D) Nikdy.'));

    expect(question.updatedAt).toBeUndefined();
  });
});

describe('parseTopics', () => {
  const page = `
OBSAH
1. ZVYKY A TRADICE .................................................. 7
2. DOPRAVA ......................................................... 9

1. ZVYKY A TRADICE

1. Otázka jedna? A) Ano. B) Ne. C) Snad. D) Nikdy.
SPRÁVNÉ ŘEŠENÍ: 1A

2. DOPRAVA

1. Otázka dvě? A) Ano. B) Ne. C) Snad. D) Nikdy.
SPRÁVNÉ ŘEŠENÍ: 1B
`;

  it('finds the topics', () => {
    expect(parseTopics(page).map((t) => t.title)).toEqual(['ZVYKY A TRADICE', 'DOPRAVA']);
  });

  // The contents page repeats every heading. Matching one is not enough to call it a topic.
  it('ignores the table of contents', () => {
    expect(parseTopics(page)).toHaveLength(2);
  });

  // "29. VÝZNAMNÉ OSOBNOSTI OD 19. STOLETÍ DO SOUČASNOSTI" has a full stop inside its
  // title. Missing it merged its ten questions into the topic before it.
  it('reads a heading containing a full stop', () => {
    const text = '29. VÝZNAMNÉ OSOBNOSTI OD 19. STOLETÍ DO SOUČASNOSTI\n\n'
      + '1. Otázka? A) Ano. B) Ne. C) Snad. D) Nikdy.\nSPRÁVNÉ ŘEŠENÍ: 1A';

    expect(parseTopics(text)).toHaveLength(1);
    expect(parseTopics(text)[0].number).toBe(29);
  });
});
