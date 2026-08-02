import { describe, expect, it } from 'vitest';
import { commonsFileUrl, parseCitations } from './citations.ts';

const section = (body: string) => `CITACE OBRAZOVÉHO MATERIÁLU\n${body}`;

/**
 * Copied out of the text unpdf extracts from the 2026 edition, line breaks included.
 *
 * The breaks are the point. An earlier version of this fixture had each entry on one line,
 * which is how the entry is laid out on the page but not how it comes out of extraction —
 * the heading, the credit and the URL are each on their own line, and the URL is split
 * again wherever the column ran out. Against the real text that parser matched nothing at
 * all while every test here passed.
 */
const REAL = section(`5. POLITICKÝ SYSTÉM
Testová úloha 1, alternativa A
[online]. [cit. 2015-10-14]. Dostupný pod licencí Public domain na WWW:
<http://commons.wikimedia.org/wiki/File:Small_coat_of_arms_of_the_Czech_Republ
ic.svg>
Testová úloha 1, alternativa B
[online]. [cit. 2015-10-14]. Dostupný pod licencí Public domain na WWW:
<https://commons.wikimedia.org/wiki/File:Flag_of_the_president_of_the_Czech_Rep
ublic.sv g?uselang=cs>
Testová úloha 10
[online]. [cit. 2013-09-27]. Dostupný pod licencí Public domain na WWW:
<http://commons.wikimedia.org/wiki/File:Small_coat_of_arms_of_the_Czech_Republ
ic.svg>
12. MĚNA A BANKOVNÍ SOUSTAVA
Testová úloha 2
Peníze, koruna, mince [online]. [cit. 2018-12-10]. Dostupný pod licencí Creative
Commons na WWW: <https://pixabay.com/cs/pen%C3%ADze-koruna-mince-bankovky-
%C4%8Desky215006/>
Testová úloha 4
100 Czech koruna Obverse [online]. [cit. 2022-12-12]. Dostupný pod licencí Creative
Commons na WWW:
<https://commons.wikimedia.org/wiki/File:100_Czech_koruna_Obverse.jpg>`);

describe('parseCitations', () => {
  const citations = parseCitations(REAL);

  it('reads every entry', () => {
    expect(citations).toHaveLength(5);
  });

  it('attributes each picture to its topic and question', () => {
    expect(citations[0]).toMatchObject({ topicNumber: 5, questionNumber: 1, letter: 'A' });
    expect(citations[4]).toMatchObject({ topicNumber: 12, questionNumber: 4 });
  });

  // "Testová úloha 10" with no "alternativa" is the picture beside the question, not one
  // of the four answers. Treating it as an answer would put it in the wrong place.
  it('leaves the letter off a question image', () => {
    expect(citations[2].letter).toBeUndefined();
    expect(citations[2].questionNumber).toBe(10);
  });

  it('reads a URL that the layout broke across two lines', () => {
    expect(citations[0].source).toBe('Small_coat_of_arms_of_the_Czech_Republic.svg');
  });

  // Broken across a line *and* mid-word, with a space left inside ".sv g".
  it('repairs a file name split inside its extension', () => {
    expect(citations[1].source).toBe('Flag_of_the_president_of_the_Czech_Republic.svg');
  });

  it('decodes a percent-escaped name split across lines', () => {
    const [citation] = parseCitations(section(`19. REGIONY A MÍSTA
Testová úloha 3
ONDRANESS [online]. [cit. 2019-12-09]. Dostupný pod licencí Creative Commons na
WWW:
<https://commons.wikimedia.org/wiki/File:Sloup_Nejsv%C4%9Bt%C4%9Bj%C5%A1%
C3%AD_Trojice,_Olomouc.jpg>`));

    expect(citation.source).toBe('Sloup_Nejsvětější_Trojice,_Olomouc.jpg');
  });

  it('keeps the credit, which the licence requires', () => {
    expect(citations[4].credit).toBe('100 Czech koruna Obverse');
  });

  it('says so when no author was printed', () => {
    expect(citations[0].credit).toBe('no author given');
  });

  it('keeps a source that is not on Commons as a plain URL', () => {
    expect(citations[3].source).toBe('https://pixabay.com/cs/pen%C3%ADze-koruna-mince-bankovky-%C4%8Desky215006/');
  });

  // A bare number on its own line is a page number. It falls inside an entry, between the
  // URL and the next heading, so it has to be dropped rather than read as content.
  it('ignores a page number printed in the middle of the section', () => {
    const [citation] = parseCitations(section(`18. PŘÍRODA A KRAJINA
Testová úloha 6
SKÁLA, B. [online]. Dostupný pod licencí Creative Commons na
WWW: <https://commons.wikimedia.org/wiki/File:Ctin%C4%9Bves.jpg>
77`));

    expect(citation).toMatchObject({ topicNumber: 18, questionNumber: 6, credit: 'SKÁLA, B.' });
  });

  it('reads nothing from a document without the section', () => {
    expect(parseCitations('a document with no pictures in it')).toEqual([]);
  });

  it('ignores entries printed before any topic heading', () => {
    expect(parseCitations(section('Testová úloha 1, alternativa A\n<http://x/wiki/File:a.jpg>'))).toEqual([]);
  });

  it('drops an entry that has no URL at all', () => {
    expect(parseCitations(section('5. POLITICKÝ SYSTÉM\nTestová úloha 1\n[online]. No link printed.'))).toEqual([]);
  });
});

describe('commonsFileUrl', () => {
  it('builds a URL that serves the file itself', () => {
    expect(commonsFileUrl('Flag_of_the_Czech_Republic.svg'))
      .toBe('https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Czech_Republic.svg');
  });

  it('escapes a name with non-ASCII characters', () => {
    expect(commonsFileUrl('Sloup_Nejsvětější.jpg')).toContain('Nejsv%C4%9Bt%C4%9B');
  });
});
