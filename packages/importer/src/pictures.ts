import { commonsFileUrl } from './citations.ts';
import { imageFileName } from './build.ts';
import type { Citation } from './citations.ts';

/** Formats Commons serves that a browser can put in an <img>. */
const USABLE = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'];

/**
 * Vector files are served as they are. Commons would rasterise them to PNG if asked for a
 * width, which for a flag or a coat of arms is strictly worse and larger.
 */
const VECTOR = 'svg';

/**
 * Commons stores originals, and the originals are photographs — several are over 10MB,
 * and the whole set comes to 105MB at full size. Nothing here is shown larger than about
 * a third of the screen, so this is generous even allowing for a high-density display.
 */
const WIDTH = 800;

/**
 * Names the layout mangled in a way that stripping spaces cannot undo, each one checked
 * by hand against Commons before being put here.
 *
 * A table rather than a cleverer repair on purpose. Guessing at a file name is how a
 * question ends up illustrated with the wrong photograph, which is the exact bug this
 * package exists to fix, so a correction only counts once a person has confirmed the
 * picture is what the question is asking about.
 */
const CORRECTIONS: Record<string, string> = {
  // Wrapped inside the date, losing the hyphen: "Praha_2005-" then "0920_n%C3%A1rodn...".
  // A sibling citation in the same topic prints "Praha_2005-09-19_Main_Station-00.jpg",
  // and the corrected name resolves while the printed one 404s.
  'Praha_2005-0920_národní_divadlo.jpg': 'Praha_2005-09-20_národní_divadlo.jpg',
};

export interface PictureProblem {
  citation: Citation;
  reason: string;
}

/**
 * Where to get a picture, and what to call the file.
 *
 * The extension comes from the Commons file name rather than from the response, so the
 * file on disk is named for what it is before a byte has been fetched.
 */
export function pictureSource(citation: Citation): { url: string; extension: string } | { reason: string } {
  const name = CORRECTIONS[citation.source] ?? citation.source;

  if (name.includes('://')) {
    // A page on some other site, not a file. The citation says where the picture came
    // from, not where the picture is, and only a person can follow that.
    return { reason: `not a Wikimedia Commons file: ${name}` };
  }

  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  if (!USABLE.includes(extension)) {
    return { reason: `Commons name has no usable file extension: ${name}` };
  }

  const url = commonsFileUrl(name);

  return {
    url: extension === VECTOR ? url : `${url}?width=${WIDTH}`,
    extension,
  };
}

export interface PictureDeps {
  /** Returns the bytes, or says why it could not. Never throws. */
  download: (url: string) => Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: string }>;
  write: (fileName: string, bytes: Uint8Array) => Promise<void>;
  /** Called before each download, so a long run says what it is doing. */
  onProgress?: (message: string) => void;
}

export interface SavedPictures {
  /** Keyed by `imageFileName`, valued by the file actually written, extension included. */
  files: Map<string, string>;
  problems: PictureProblem[];
}

/**
 * Downloads every cited picture and writes it under a name that says which question it
 * belongs to.
 *
 * The bank's own files are named by position — `17alt3.jpg` is "topic 17, alternative 3" —
 * so renumbering the questions silently repoints every later file. That is how four
 * answers came to show portraits of presidents instead of a theatre. These names cannot
 * drift, because they carry the question with them.
 *
 * Sequentially, and identifying itself, because this is somebody else's server.
 */
export async function savePictures(
  citations: Citation[],
  { download, write, onProgress }: PictureDeps,
): Promise<SavedPictures> {
  const files = new Map<string, string>();
  const problems: PictureProblem[] = [];

  for (const citation of citations) {
    const name = imageFileName(citation);

    // Two questions can cite the same Commons file; fetching it twice would be rude.
    if (files.has(name)) continue;

    const source = pictureSource(citation);

    if ('reason' in source) {
      problems.push({ citation, reason: source.reason });
      continue;
    }

    const file = `${name}.${source.extension}`;
    onProgress?.(`${file}  ←  ${citation.source}`);

    const result = await download(source.url);

    if (!result.ok) {
      problems.push({ citation, reason: result.reason });
      continue;
    }

    await write(file, result.bytes);
    files.set(name, file);
  }

  return { files, problems };
}

/**
 * The credits, as the licences require. Grouped by the file we wrote rather than by the
 * Commons name, so it can be checked against what is actually on disk.
 */
export function attribution(citations: Citation[], files: Map<string, string>): string {
  const lines = [
    '# Picture credits',
    '',
    'Reproduced from the official question bank published by the Národní pedagogický',
    'institut ČR. Each picture is credited below as the bank credits it, with the',
    'Wikimedia Commons file it came from.',
    '',
    '| File | Commons | Credit |',
    '|---|---|---|',
  ];

  const seen = new Set<string>();

  for (const citation of citations) {
    const file = files.get(imageFileName(citation));
    if (!file || seen.has(file)) continue;

    seen.add(file);
    lines.push(`| \`${file}\` | [${citation.source}](${commonsFileUrl(citation.source)}) | ${citation.credit} |`);
  }

  return `${lines.join('\n')}\n`;
}
