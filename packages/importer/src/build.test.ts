import { describe, expect, it } from 'vitest';
import { buildQuestions, imageFileName, placeTopic } from './build.ts';
import type { Citation } from './citations.ts';
import type { Topic } from './types.ts';

const path = (name: string) => `/images/questions/${name}.jpg`;

/** Every question in the bank ends with this line; it is what separates one from the next. */
const END = '\nDatum aktualizace testové úlohy: 1. 1. 2026\n';

const textTopic = (number: number): Topic => ({
  number,
  title: 'TEST',
  body: `1. Otázka? A) Jedna. B) Dvě. C) Tři. D) Čtyři.${END}SPRÁVNÉ ŘEŠENÍ: 1C`,
});

const photoTopic = (number: number): Topic => ({
  number,
  title: 'TEST',
  body: `1. Na kterém obrázku?\n\nA)\n\nB)\n\nC)\n\nD)${END}SPRÁVNÉ ŘEŠENÍ: 1B`,
});

const pictures = (topicNumber: number): Citation[] => (['A', 'B', 'C', 'D'] as const).map((letter) => ({
  topicNumber, questionNumber: 1, letter, source: `${letter}.jpg`, credit: 'someone',
}));

describe('placeTopic', () => {
  // 16 + 7 + 7. The exam's 16/7/7 split falls out of this rather than being a rule.
  it.each([
    [1, 0, 0], [16, 0, 15], [17, 1, 0], [23, 1, 6], [24, 2, 0], [30, 2, 6],
  ])('puts topic %i in category %i, subcategory %i', (topic, category, subCategory) => {
    expect(placeTopic(topic)).toEqual({ category, subCategory });
  });

  it('refuses a topic number outside the bank', () => {
    expect(placeTopic(31)).toBeNull();
    expect(placeTopic(0)).toBeNull();
  });
});

describe('imageFileName', () => {
  // The source names files by position, so renumbering the bank silently repoints them.
  // These say which question and which alternative, so they cannot drift.
  it('names an answer picture by its question and letter', () => {
    expect(imageFileName({ topicNumber: 19, questionNumber: 4, letter: 'C', source: 'x', credit: 'y' }))
      .toBe('t19-q4-c');
  });

  it('marks a question picture as such', () => {
    expect(imageFileName({ topicNumber: 5, questionNumber: 10, source: 'x', credit: 'y' }))
      .toBe('t5-q10-question');
  });
});

describe('buildQuestions', () => {
  it('builds a text question in the shape the app stores', () => {
    const { questions, problems } = buildQuestions([textTopic(1)], [], path);

    expect(problems).toEqual([]);
    expect(questions[0]).toEqual({
      question: 'Otázka?',
      answers: ['Jedna.', 'Dvě.', 'Tři.', 'Čtyři.'],
      correctAnswer: '3',
      category: 0,
      subCategory: 0,
      questionType: 'text',
      answerSelectionType: 'single',
      point: '1',
      questionPic: null,
    });
  });

  it('turns the answer key letter into the stored index', () => {
    expect(buildQuestions([textTopic(1)], [], path).questions[0].correctAnswer).toBe('3');
  });

  it('places a question by its topic', () => {
    const { questions } = buildQuestions([textTopic(24)], [], path);

    expect(questions[0]).toMatchObject({ category: 2, subCategory: 0 });
  });

  it('points a picture question at the imported files', () => {
    const { questions, problems } = buildQuestions([photoTopic(19)], pictures(19), path);

    expect(problems).toEqual([]);
    expect(questions[0].questionType).toBe('photo');
    expect(questions[0].answers).toEqual([
      '/images/questions/t19-q1-a.jpg',
      '/images/questions/t19-q1-b.jpg',
      '/images/questions/t19-q1-c.jpg',
      '/images/questions/t19-q1-d.jpg',
    ]);
    expect(questions[0].correctAnswer).toBe('2');
  });

  it('attaches a question picture when one is cited', () => {
    const citations: Citation[] = [{ topicNumber: 1, questionNumber: 1, source: 'x.jpg', credit: 'y' }];
    const { questions } = buildQuestions([textTopic(1)], citations, path);

    expect(questions[0].questionPic).toBe('/images/questions/t1-q1-question.jpg');
  });

  // Refusing loudly matters more than producing something: quietly dropping a question is
  // how a bank of 300 becomes 299 without anyone noticing.
  it('refuses a picture question whose citations are incomplete', () => {
    const { questions, problems } = buildQuestions([photoTopic(19)], pictures(19).slice(0, 3), path);

    expect(questions).toEqual([]);
    expect(problems[0].reason).toContain('citations do not cover all four');
  });

  it('refuses a question with no entry in the answer key', () => {
    const topic: Topic = { number: 1, title: 'T', body: `1. Otázka? A) a. B) b. C) c. D) d.${END}` };
    const { questions, problems } = buildQuestions([topic], [], path);

    expect(questions).toEqual([]);
    expect(problems[0].reason).toContain('no correct answer');
  });

  it('refuses a question with an empty alternative', () => {
    const topic: Topic = { number: 1, title: 'T', body: `1. Otázka? A) a. B) b. C) c.${END}SPRÁVNÉ ŘEŠENÍ: 1A` };
    const { questions, problems } = buildQuestions([topic], [], path);

    expect(questions).toEqual([]);
    expect(problems[0].reason).toContain('empty');
  });
});
