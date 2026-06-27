// Tiny zero-framework HTTP server for recipe ratings — the one dynamic sidecar
// beside the otherwise pure-static site. Traefik routes
// `Host(mattschoe.dev) && PathPrefix(/api)` here (same origin, so no CORS), and
// forwards the visitor IP in X-Forwarded-For.
//
// Routes:
//   GET  /healthz            → { ok: true }                     (container health)
//   GET  /api/ratings        → { generatedAt, ratings: {…} }    (CI snapshot + runtime read)
//   GET  /api/ratings/:slug  → { slug, count, average }
//   POST /api/ratings/:slug  { value: 1..5, voterId } → { slug, count, average }
//
// Everything else is a 404; wrong method on a known route is a 405. Bad input
// (ValidationError) is a 400. A small body cap and a coarse request throttle
// keep the surface tight.
//
// The throttle is a *coarse safety valve*, NOT a per-visitor limiter: in
// production the VPS runs rootless Podman, whose port forwarder SNATs every
// inbound connection to one internal address before Traefik, so clientIp() is
// effectively constant and the bucket degrades to one global bucket. We
// therefore keep the caps generous (separate read/write buckets) so a normal
// traffic burst never 429s a real visitor — the throttle only blunts a runaway
// loop. Vote-stuffing by minting fresh voter tokens is possible and accepted
// (see store.mjs / README): anonymous one-tap rating has no robust server-side
// cap when all visitors share one IP, and `aggregateRating` is only ever
// emitted when ≥1 real rating exists.

import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import {
  openDb,
  recordVote,
  aggregate,
  aggregateAll,
  validateSlug,
  ipHash,
  ValidationError,
} from './store.mjs';

const MAX_BODY = 1024; // bytes — a {"value":5} body is tiny; cap hard.

// Coarse fixed-window throttle caps (per IP, but constant ≈ global in prod).
// Reads are cheap and idempotent → a generous backstop against a runaway loop.
// Writes are far above any organic voting rate but blunt a trivial curl loop.
const WINDOW_MS = 10_000;
const READ_MAX = 600;
const WRITE_MAX = 60;

/**
 * A fixed-window request throttle keyed on an opaque id (the client IP). Returns
 * a `(id, now) → boolean` predicate; `true` means the caller is over `max`
 * within `windowMs`. In-memory and best-effort (one process). Expired buckets
 * are swept opportunistically so the map can't grow unbounded.
 */
function makeThrottle(max, windowMs) {
  const hits = new Map(); // id -> { count, reset }
  return function throttled(id, now) {
    const e = hits.get(id);
    if (!e || now > e.reset) {
      hits.set(id, { count: 1, reset: now + windowMs });
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
      }
      return false;
    }
    e.count += 1;
    return e.count > max;
  };
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

/**
 * Visitor IP. We sit behind exactly one trusted proxy (Traefik), which appends
 * the real client IP to the *right* of X-Forwarded-For. The leftmost entry is
 * whatever the client sent and is fully spoofable, so we take the *last* hop
 * (the one Traefik added), falling back to the socket address when there's no
 * header (direct/local requests). Note: in production this is constant (Podman
 * SNAT), so it only ever feeds the soft ip_hash signal and the coarse throttle.
 */
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const hops = xff.split(',');
    return hops[hops.length - 1].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/**
 * Read the request body with a hard size cap. On overflow it rejects with a
 * ValidationError (the handler maps it to a clean 400) and stops accumulating —
 * it does *not* destroy the socket, so the error response can still be written.
 */
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let aborted = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (aborted) return;
      size += chunk.length;
      if (size > max) {
        aborted = true;
        reject(new ValidationError('request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!aborted) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

/**
 * Build the ratings HTTP server over an open `db` handle — without listening, so
 * tests can drive it on an ephemeral port. `salt` (when set) salts the soft
 * ip_hash signal; an empty salt stores an empty ip_hash and POSTs still work.
 * `readLimit`/`writeLimit` are `{ max, windowMs }` and default to the coarse
 * production caps; tests pass tiny limits to exercise the 429 path.
 */
export function createRatingsServer({
  db,
  salt = '',
  readLimit = { max: READ_MAX, windowMs: WINDOW_MS },
  writeLimit = { max: WRITE_MAX, windowMs: WINDOW_MS },
} = {}) {
  const throttleRead = makeThrottle(readLimit.max, readLimit.windowMs);
  const throttleWrite = makeThrottle(writeLimit.max, writeLimit.windowMs);

  return createServer(async (req, res) => {
    try {
      const ip = clientIp(req);
      const method = req.method ?? 'GET';
      const throttle = method === 'POST' ? throttleWrite : throttleRead;
      if (throttle(ip, Date.now())) return send(res, 429, { error: 'rate limited' });

      const { pathname } = new URL(req.url, 'http://localhost');

      if (pathname === '/healthz') {
        if (method !== 'GET') return send(res, 405, { error: 'method not allowed' });
        return send(res, 200, { ok: true });
      }

      if (pathname === '/api/ratings') {
        if (method !== 'GET') return send(res, 405, { error: 'method not allowed' });
        return send(res, 200, {
          generatedAt: new Date().toISOString(),
          ratings: aggregateAll(db),
        });
      }

      const m = pathname.match(/^\/api\/ratings\/([^/]+)$/);
      if (m) {
        const slug = validateSlug(decodeURIComponent(m[1]));

        if (method === 'GET') {
          return send(res, 200, { slug, ...aggregate(db, slug) });
        }

        if (method === 'POST') {
          const raw = await readBody(req, MAX_BODY);
          let parsed;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            throw new ValidationError('body must be JSON');
          }
          // Dedup is keyed on the client's anonymous voter token, not the IP. The
          // ip_hash is stored only as a soft abuse signal (and is empty when no
          // salt is configured) — it never gates the vote.
          const ipHashValue = salt ? ipHash(ip, salt) : '';
          const agg = recordVote(db, slug, parsed?.value, parsed?.voterId, ipHashValue);
          return send(res, 200, { slug, ...agg });
        }

        return send(res, 405, { error: 'method not allowed' });
      }

      return send(res, 404, { error: 'not found' });
    } catch (err) {
      if (err instanceof ValidationError) return send(res, 400, { error: err.message });
      console.error('[ratings]', err);
      return send(res, 500, { error: 'internal error' });
    }
  });
}

// Production entrypoint: only run when invoked directly (`node server.mjs`), so
// the module stays importable for tests without binding a port.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const PORT = Number(process.env.PORT ?? 8080);
  const DATA = process.env.RATINGS_DATA ?? '/data/ratings.db';
  const SALT = process.env.RATINGS_IP_SALT ?? '';

  const db = openDb(DATA);
  const server = createRatingsServer({ db, salt: SALT });
  server.listen(PORT, () => {
    console.log(`[ratings] listening on :${PORT}, data=${DATA}`);
    if (!SALT) console.warn('[ratings] RATINGS_IP_SALT is unset — ip_hash abuse signal disabled.');
  });
}
