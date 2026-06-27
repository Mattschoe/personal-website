import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDb } from './store.mjs';
import { createRatingsServer } from './server.mjs';

const VOTER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

// Boot the server on an ephemeral port over an in-memory DB and return a base
// URL + a `close()`. No salt by default, so the ip_hash-empty POST path runs.
async function boot(opts = {}) {
  const db = openDb(':memory:');
  const server = createRatingsServer({ db, ...opts });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

let srv;
afterEach(async () => {
  if (srv) await srv.close();
  srv = undefined;
});

const post = (base, slug, body) =>
  fetch(`${base}/api/ratings/${slug}`, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/ratings/:slug', () => {
  it('records a vote with no salt configured (ip_hash-empty path) → 200 + aggregate', async () => {
    srv = await boot(); // salt defaults to ''
    const res = await post(srv.base, 'soup', { value: 5, voterId: VOTER_A });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ slug: 'soup', count: 1, average: 5 });
  });

  it('rejects a missing/malformed voterId → 400', async () => {
    srv = await boot();
    const missing = await post(srv.base, 'soup', { value: 5 });
    expect(missing.status).toBe(400);
    const bad = await post(srv.base, 'soup', { value: 5, voterId: 'short' });
    expect(bad.status).toBe(400);
  });

  it('rejects an out-of-range value → 400', async () => {
    srv = await boot();
    const res = await post(srv.base, 'soup', { value: 9, voterId: VOTER_A });
    expect(res.status).toBe(400);
  });

  it('rejects a non-JSON body → 400', async () => {
    srv = await boot();
    const res = await post(srv.base, 'soup', 'not json');
    expect(res.status).toBe(400);
  });

  it('rejects an oversized body → 400', async () => {
    srv = await boot();
    const huge = JSON.stringify({ value: 5, voterId: VOTER_A, pad: 'x'.repeat(2000) });
    const res = await post(srv.base, 'soup', huge);
    expect(res.status).toBe(400);
  });

  it('rejects a malformed slug → 400', async () => {
    srv = await boot();
    const res = await post(srv.base, 'Bad_Slug!', { value: 5, voterId: VOTER_A });
    expect(res.status).toBe(400);
  });
});

describe('GET routes', () => {
  it('GET /healthz → 200 { ok: true }', async () => {
    srv = await boot();
    const res = await fetch(`${srv.base}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('GET /api/ratings → 200 { generatedAt, ratings }', async () => {
    srv = await boot();
    await post(srv.base, 'soup', { value: 4, voterId: VOTER_A });
    const res = await fetch(`${srv.base}/api/ratings`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.generatedAt).toBe('string');
    expect(body.ratings).toEqual({ soup: { count: 1, average: 4 } });
  });

  it('GET /api/ratings/:slug → 200 counts', async () => {
    srv = await boot();
    await post(srv.base, 'soup', { value: 3, voterId: VOTER_A });
    const res = await fetch(`${srv.base}/api/ratings/soup`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ slug: 'soup', count: 1, average: 3 });
  });
});

describe('routing edge cases', () => {
  it('wrong method on a known route → 405', async () => {
    srv = await boot();
    const res = await fetch(`${srv.base}/api/ratings`, { method: 'POST', body: '{}' });
    expect(res.status).toBe(405);
  });

  it('unknown path → 404', async () => {
    srv = await boot();
    const res = await fetch(`${srv.base}/nope`);
    expect(res.status).toBe(404);
  });
});

describe('throttle', () => {
  it('429s writes over the write limit, leaving reads unaffected', async () => {
    // Tiny write bucket, generous read bucket.
    srv = await boot({
      writeLimit: { max: 2, windowMs: 10_000 },
      readLimit: { max: 1000, windowMs: 10_000 },
    });
    const r1 = await post(srv.base, 'soup', { value: 5, voterId: VOTER_A });
    const r2 = await post(srv.base, 'soup', { value: 4, voterId: VOTER_A });
    const r3 = await post(srv.base, 'soup', { value: 3, voterId: VOTER_A });
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429); // 3rd write over the limit of 2

    // Reads use a separate bucket and are not blocked by the write storm.
    const read = await fetch(`${srv.base}/api/ratings/soup`);
    expect(read.status).toBe(200);
  });
});
