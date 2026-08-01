import { describe, expect, it } from 'vitest';
import { commonsFileUrl, parseCitations } from './citations.ts';

const section = (body: string) => `CITACE OBRAZOVÉHO MATERIÁLU\n${body}`;

// Verbatim from the 2026 edition.
const POLITICKY_SYSTEM = section(`5. POLITICKÝ SYSTÉM
Testová úloha 1, alternativa A [online]. [cit. 2015-10-14]. Dostupný pod licencí Public domain na WWW: <http://commons.wikimedia.org/wiki/File:Small_coat_of_arms_of_the_Czech_Republ ic.svg>
Testová úloha 1, alternativa B [online]. [cit. 2015-10-14]. Dostupný pod licencí Public domain na WWW: <https://commons.wikimedia.org/wiki/File:Flag_of_the_president_of_the_Czech_Rep ublic.sv g?uselang=cs>
Testová úloha 10 [online]. [cit. 2013-09-27]. Dostupný pod licencí Public domain na WWW: <http://commons.wikimedia.org/wiki/File:Small_coat_of_arms_of_the_Czech_Republ ic.svg>
12. MĚNA A BANKOVNÍ SOUSTAVA
Testová úloha 4 100 Czech koruna Obverse [online]. [cit. 2022-12-12]. Dostupný pod licencí Creative Commons na WWW: <https://commons.wikimedia.org/wiki/File:100_Czech_koruna_Obverse.jpg>`);

describe('parseCitations', () => {
  const citations = parseCitations(POLITICKY_SYSTEM);

  it('reads every entry', () => {
    expect(citations).toHaveLength(4);
  });

  it('attributes each picture to its topic and question', () => {
    expect(citations[0]).toMatchObject({ topicNumber: 5, questionNumber: 1, letter: 'A' });
    expect(citations[3]).toMatchObject({ topicNumber: 12, questionNumber: 4 });
  });

  // "Testová úloha 10" with no "alternativa" is the picture beside the question, not one
  // of the four answers. Treating it as an answer would put it in the wrong place.
  it('leaves the letter off a question image', () => {
    expect(citations[2].letter).toBeUndefined();
    expect(citations[2].questionNumber).toBe(10);
  });

  // The layout breaks URLs across lines, inside percent escapes and inside words.
  it('repairs a file name split by the layout', () => {
    expect(citations[0].source).toBe('Small_coat_of_arms_of_the_Czech_Republic.svg');
  });

  it('drops the query string a wrapped URL carries', () => {
    expect(citations[1].source).toBe('Flag_of_the_president_of_the_Czech_Republic.svg');
  });

  it('decodes a percent-escaped name', () => {
    const [citation] = parseCitations(section(`19. REGIONY A MÍSTA
Testová úloha 3 ONDRANESS [online]. Dostupný na WWW: <https://commons.wikimedia.org/wiki/File:Sloup _Nejsv %C4%9Bt%C4%9 Bj% C5 %A1 % C3%AD_Trojice,_Olomouc.jpg>`));

    expect(citation.source).toBe('Sloup_Nejsvětější_Trojice,_Olomouc.jpg');
  });

  it('keeps the credit, which the licence requires', () => {
    expect(citations[3].credit).toBe('100 Czech koruna Obverse');
  });

  it('says so when no author was printed', () => {
    expect(citations[0].credit).toBe('no author given');
  });

  it('keeps a source that is not on Commons as a plain URL', () => {
    const [citation] = parseCitations(section(`12. MĚNA A BANKOVNÍ SOUSTAVA
Testová úloha 2 Peníze [online]. Dostupný na WWW: <https://pixabay.com/cs/pen%C3%ADze-koruna-215006/>`));

    expect(citation.source).toBe('https://pixabay.com/cs/pen%C3%ADze-koruna-215006/');
  });

  it('reads nothing from a document without the section', () => {
    expect(parseCitations('a document with no pictures in it')).toEqual([]);
  });

  it('ignores entries printed before any topic heading', () => {
    expect(parseCitations(section('Testová úloha 1, alternativa A ... <http://x/wiki/File:a.jpg>'))).toEqual([]);
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
