import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { getBytes, getText, headFacts, USER_AGENT } from './fetch.ts';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const HTML = new TextEncoder().encode('<!doctype html><title>Sign in</title>');

/** Queues responses, one per attempt, so a retry gets the next one. */
const respond = (...responses: Array<Response | Error>) => {
  const queue = [...responses];
  const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
    void args;
    // The last one stays put, so a queue of one answers every attempt with it.
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    if (next instanceof Error) throw next;
    return next.clone();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const jpeg = (body: Uint8Array = JPEG, init: ResponseInit = {}) => new Response(body, init);

beforeEach(() => {
  // The real delays are 2s and 4s. Nothing here depends on elapsed time, only on the
  // number of attempts, so waiting six seconds per test would buy nothing.
  vi.stubGlobal('setTimeout', (run: () => void) => { run(); return 0; });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request behaviour', () => {
  it('identifies itself, so the source site can see who is asking', async () => {
    const fetchMock = respond(jpeg());
    await getBytes('https://example.test/1.jpg', 'jpeg');

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
    });
  });

  it('reports a 404 as gone rather than as a failure to check', async () => {
    respond(new Response(null, { status: 404 }));

    expect(await getText('https://example.test/x')).toEqual({ ok: false, missing: true });
  });

  it('does not retry a 404 — it is already an answer', async () => {
    const fetchMock = respond(new Response(null, { status: 404 }));
    await getText('https://example.test/x');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a server error and accepts a later success', async () => {
    const fetchMock = respond(new Response(null, { status: 503 }), jpeg());
    const result = await getBytes('https://example.test/1.jpg', 'jpeg');

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // The distinction the whole tool rests on: a rate limit must not read as a change, and
  // must not read as unchanged either.
  it('gives up after three attempts and admits it could not check', async () => {
    const fetchMock = respond(new Response(null, { status: 500 }));
    const result = await getBytes('https://example.test/1.jpg', 'jpeg');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ ok: false, unverified: 'HTTP 500' });
  });

  it('treats a network error the same way, keeping its message', async () => {
    respond(new Error('getaddrinfo ENOTFOUND'));

    expect(await getText('https://example.test/x'))
      .toEqual({ ok: false, unverified: 'getaddrinfo ENOTFOUND' });
  });
});

describe('getBytes', () => {
  it('accepts a body whose magic bytes match what was asked for', async () => {
    respond(new Response(PDF));
    const result = await getBytes('https://example.test/bank.pdf', 'pdf');

    expect(result).toMatchObject({ ok: true });
  });

  // A 200 carrying HTML means a redirect to a sign-in page. Hashing that would record the
  // login page as the image and call every later run "unchanged".
  it('refuses HTML served with a 200, naming what it got instead', async () => {
    respond(new Response(HTML, { headers: { 'content-type': 'text/html' } }));
    const result = await getBytes('https://example.test/1.jpg', 'jpeg');

    expect(result).toEqual({ ok: false, unverified: 'expected jpeg, got text/html' });
  });

  it('refuses a PDF served where a JPEG was expected', async () => {
    respond(new Response(PDF, { headers: { 'content-type': 'application/pdf' } }));

    expect(await getBytes('https://example.test/1.jpg', 'jpeg'))
      .toMatchObject({ ok: false, unverified: 'expected jpeg, got application/pdf' });
  });

  it('says so plainly when the server sent no content type', async () => {
    respond(new Response(new Uint8Array([1, 2, 3])));

    expect(await getBytes('https://example.test/1.jpg', 'jpeg'))
      .toMatchObject({ unverified: 'expected jpeg, got unknown type' });
  });
});

describe('headFacts', () => {
  it('takes the three validators the comparison uses', async () => {
    const fetchMock = respond(new Response(null, {
      headers: {
        etag: '"23b83-645fc38209b00"',
        'last-modified': 'Mon, 15 Dec 2025 11:50:36 GMT',
        'content-length': '146307',
      },
    }));

    expect(await headFacts('https://example.test/1.jpg')).toEqual({
      ok: true,
      value: {
        etag: '"23b83-645fc38209b00"',
        lastModified: 'Mon, 15 Dec 2025 11:50:36 GMT',
        contentLength: '146307',
      },
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'HEAD' });
  });

  it('returns nulls, not absent keys, when the server sends no validators', async () => {
    respond(new Response(null));

    expect(await headFacts('https://example.test/1.jpg'))
      .toEqual({ ok: true, value: { etag: null, lastModified: null, contentLength: null } });
  });
});

describe('getText', () => {
  it('returns the body as text', async () => {
    respond(new Response('<html>databanka</html>'));

    expect(await getText('https://example.test/page')).toEqual({ ok: true, value: '<html>databanka</html>' });
  });
});
