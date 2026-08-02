import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { getBytes, getText, USER_AGENT } from './fetch.ts';

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

const pdf = (body: Uint8Array = PDF, init: ResponseInit = {}) => new Response(body, init);

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
    const fetchMock = respond(pdf());
    await getBytes('https://example.test/1.jpg', 'pdf');

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
    const fetchMock = respond(new Response(null, { status: 503 }), pdf());
    const result = await getBytes('https://example.test/1.jpg', 'pdf');

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // The distinction the whole tool rests on: a rate limit must not read as a change, and
  // must not read as unchanged either.
  it('gives up after three attempts and admits it could not check', async () => {
    const fetchMock = respond(new Response(null, { status: 500 }));
    const result = await getBytes('https://example.test/1.jpg', 'pdf');

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

    expect(await getBytes('https://example.test/bank.pdf', 'pdf')).toMatchObject({ ok: true });
  });

  // A 200 carrying HTML means a redirect to a sign-in page. Treating that as the question
  // bank would record the login page as the source and call every later run "unchanged".
  it('refuses HTML served with a 200, naming what it got instead', async () => {
    respond(new Response(HTML, { headers: { 'content-type': 'text/html' } }));

    expect(await getBytes('https://example.test/bank.pdf', 'pdf'))
      .toEqual({ ok: false, unverified: 'expected pdf, got text/html' });
  });

  it('refuses a JPEG served where a PDF was expected', async () => {
    respond(new Response(new Uint8Array([0xff, 0xd8, 0xff]), { headers: { 'content-type': 'image/jpeg' } }));

    expect(await getBytes('https://example.test/bank.pdf', 'pdf'))
      .toMatchObject({ ok: false, unverified: 'expected pdf, got image/jpeg' });
  });

  it('says so plainly when the server sent no content type', async () => {
    respond(new Response(new Uint8Array([1, 2, 3])));

    expect(await getBytes('https://example.test/bank.pdf', 'pdf'))
      .toMatchObject({ unverified: 'expected pdf, got unknown type' });
  });
});

describe('getText', () => {
  it('returns the body as text', async () => {
    respond(new Response('<html>databanka</html>'));

    expect(await getText('https://example.test/page')).toEqual({ ok: true, value: '<html>databanka</html>' });
  });
});
