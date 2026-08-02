import { describe, expect, it, vi } from 'vitest';
import { attribution, pictureSource, savePictures } from './pictures.ts';
import type { Citation } from './citations.ts';
import type { PictureDeps } from './pictures.ts';

const citation = (over: Partial<Citation> = {}): Citation => ({
  topicNumber: 5,
  questionNumber: 1,
  letter: 'A',
  source: 'Flag_of_the_Czech_Republic.svg',
  credit: 'no author given',
  ...over,
});

const BYTES = new Uint8Array([1, 2, 3]);

const deps = (over: Partial<PictureDeps> = {}): PictureDeps => ({
  download: vi.fn(async () => ({ ok: true as const, bytes: BYTES })),
  write: vi.fn(async () => {}),
  ...over,
});

describe('pictureSource', () => {
  it('turns a Commons name into a file URL', () => {
    expect(pictureSource(citation())).toEqual({
      url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Czech_Republic.svg',
      extension: 'svg',
    });
  });

  it('keeps the extension the Commons name carries, whatever it is', () => {
    expect(pictureSource(citation({ source: '100_Czech_koruna_Obverse.jpg' })))
      .toMatchObject({ extension: 'jpg' });
  });

  // Commons stores originals: the full set comes to 105MB, several photographs over 10MB
  // each, for pictures shown at about a third of the screen.
  it('asks for a sensible width rather than the original photograph', () => {
    expect(pictureSource(citation({ source: 'Hrad_Karlstejn.jpg' })))
      .toMatchObject({ url: expect.stringContaining('?width=800') });
  });

  // Asking for a width would rasterise it to PNG, which for a flag is larger and worse.
  it('takes a vector file as it is', () => {
    const source = pictureSource(citation());

    expect('url' in source && source.url).not.toContain('width');
  });

  // A citation can name the page a picture came from rather than a file on Commons.
  it('refuses a source that is a URL to another site', () => {
    expect(pictureSource(citation({ source: 'https://pixabay.com/cs/penize-215006/' })))
      .toEqual({ reason: 'not a Wikimedia Commons file: https://pixabay.com/cs/penize-215006/' });
  });

  it('refuses a name with no file extension', () => {
    expect(pictureSource(citation({ source: 'Villa_Tugendhat' })))
      .toMatchObject({ reason: expect.stringContaining('no usable file extension') });
  });

  it('refuses an extension a browser cannot display', () => {
    expect(pictureSource(citation({ source: 'Something.tiff' })))
      .toMatchObject({ reason: expect.stringContaining('no usable file extension') });
  });
});

describe('savePictures', () => {
  // The whole point of the exercise. The bank names files by position, so renumbering the
  // questions repoints them silently; these names carry the question with them.
  it('names the file after the question, not the source', async () => {
    const d = deps();
    const { files } = await savePictures([citation({ topicNumber: 19, questionNumber: 4, letter: 'C' })], d);

    expect(files.get('t19-q4-c')).toBe('t19-q4-c.svg');
    expect(d.write).toHaveBeenCalledWith('t19-q4-c.svg', BYTES);
  });

  it('marks a picture that belongs to the question rather than an answer', async () => {
    const { files } = await savePictures([citation({ letter: undefined })], deps());

    expect([...files.values()]).toEqual(['t5-q1-question.svg']);
  });

  it('downloads from Commons', async () => {
    const d = deps();
    await savePictures([citation()], d);

    expect(d.download).toHaveBeenCalledWith(
      'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Czech_Republic.svg',
    );
  });

  it('writes every picture it is given', async () => {
    const d = deps();
    const { files, problems } = await savePictures([
      citation({ letter: 'A' }), citation({ letter: 'B' }), citation({ letter: 'C' }),
    ], d);

    expect(files.size).toBe(3);
    expect(problems).toEqual([]);
  });

  // Two questions citing the same Commons file is common — the coat of arms appears twice
  // in topic 5 alone. Each gets its own file, but under its own question's name.
  it('gives each question its own copy, under its own name', async () => {
    const { files } = await savePictures([
      citation({ questionNumber: 1, letter: 'A' }),
      citation({ questionNumber: 10, letter: undefined }),
    ], deps());

    expect([...files.values()]).toEqual(['t5-q1-a.svg', 't5-q10-question.svg']);
  });

  it('does not fetch the same question picture twice', async () => {
    const d = deps();
    await savePictures([citation(), citation()], d);

    expect(d.download).toHaveBeenCalledTimes(1);
  });

  it('reports a failed download and carries on with the rest', async () => {
    const d = deps({
      download: vi.fn(async (url: string) => (url.includes('Flag')
        ? { ok: false as const, reason: 'HTTP 404' }
        : { ok: true as const, bytes: BYTES })),
    });

    const { files, problems } = await savePictures([
      citation({ letter: 'A' }),
      citation({ letter: 'B', source: 'Coat_of_arms.jpg' }),
    ], d);

    expect(problems).toEqual([{ citation: expect.objectContaining({ letter: 'A' }), reason: 'HTTP 404' }]);
    expect([...files.values()]).toEqual(['t5-q1-b.jpg']);
  });

  it('never writes a file it could not download', async () => {
    const d = deps({ download: vi.fn(async () => ({ ok: false as const, reason: 'HTTP 500' })) });
    await savePictures([citation()], d);

    expect(d.write).not.toHaveBeenCalled();
  });

  // Somebody else's server. One request at a time.
  it('downloads one at a time', async () => {
    let running = 0;
    let overlapped = false;
    const d = deps({
      download: vi.fn(async () => {
        running += 1;
        overlapped ||= running > 1;
        await Promise.resolve();
        running -= 1;
        return { ok: true as const, bytes: BYTES };
      }),
    });

    await savePictures([citation({ letter: 'A' }), citation({ letter: 'B' }), citation({ letter: 'C' })], d);

    expect(overlapped).toBe(false);
  });

  it('says what it is doing', async () => {
    const onProgress = vi.fn();
    await savePictures([citation()], deps({ onProgress }));

    expect(onProgress).toHaveBeenCalledWith('t5-q1-a.svg  ←  Flag_of_the_Czech_Republic.svg');
  });
});

describe('attribution', () => {
  it('credits each file that was written', async () => {
    const one = citation({ credit: 'SKÁLA, B.' });
    const { files } = await savePictures([one], deps());

    const text = attribution([one], files);

    expect(text).toContain('| `t5-q1-a.svg` |');
    expect(text).toContain('SKÁLA, B.');
    expect(text).toContain('Special:FilePath/Flag_of_the_Czech_Republic.svg');
  });

  it('leaves out pictures that were never written', () => {
    expect(attribution([citation()], new Map())).not.toContain('t5-q1-a');
  });
});

describe('names the layout mangled', () => {
  // Printed as "Praha_2005-" / "0920_n%C3%A1rodn%C3%AD_divadlo.jpg" across a line break,
  // which loses the hyphen inside the date. The printed name 404s; this one resolves.
  it('uses the corrected Commons name', () => {
    expect(pictureSource(citation({ source: 'Praha_2005-0920_národní_divadlo.jpg' })))
      .toMatchObject({ url: expect.stringContaining('Praha_2005-09-20_n') });
  });

  it('still writes the file under the question it belongs to', async () => {
    const { files } = await savePictures(
      [citation({ topicNumber: 30, questionNumber: 3, letter: 'B', source: 'Praha_2005-0920_národní_divadlo.jpg' })],
      deps(),
    );

    expect([...files.values()]).toEqual(['t30-q3-b.jpg']);
  });
});
