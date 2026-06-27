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
// (ValidationError) is a 400. A small body cap and a coarse per-IP request
// throttle keep the surface tight.

import { createServer } from 'node:http';
import {
  openDb,
  recordVote,
  aggregate,
  aggregateAll,
  validateSlug,
  ipHash,
  ValidationError,
} from './store.mjs';

const PORT = Number(process.env.PORT ?? 8080);
const DATA = process.env.RATINGS_DATA ?? '/data/ratings.db';
const SALT = process.env.RATINGS_IP_SALT ?? '';
const MAX_BODY = 1024; // bytes — a {"value":5} body is tiny; cap hard.

// Coarse fixed-window throttle: at most MAX_REQ requests per WINDOW_MS per IP.
// In-memory and best-effort (one process), enough to blunt a hammering client.
const WINDOW_MS = 10_000;
const MAX_REQ = 60;
const hits = new Map(); // ip -> { count, reset }

function throttled(ip, now) {
  const e = hits.get(ip);
  if (!e || now > e.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    // Opportunistically drop expired buckets so the map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return false;
  }
  e.count += 1;
  return e.count > MAX_REQ;
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
 * whatever the client sent and is fully spoofable — taking it would let an
 * attacker mint a fresh ip_hash per request and defeat both the dedup and the
 * throttle. So take the *last* hop (the one Traefik added), falling back to the
 * socket address when there's no header (direct/local requests).
 */
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const hops = xff.split(',');
    return hops[hops.length - 1].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/** Read the request body with a hard size cap (rejects on overflow). */
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > max) {
        reject(new ValidationError('request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const db = openDb(DATA);

const server = createServer(async (req, res) => {
  try {
    const ip = clientIp(req);
    if (throttled(ip, Date.now())) return send(res, 429, { error: 'rate limited' });

    const { pathname } = new URL(req.url, 'http://localhost');
    const method = req.method ?? 'GET';

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
        const ipHashValue = SALT ? ipHash(ip, SALT) : '';
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

server.listen(PORT, () => {
  console.log(`[ratings] listening on :${PORT}, data=${DATA}`);
  if (!SALT) console.warn('[ratings] RATINGS_IP_SALT is unset — ip_hash abuse signal disabled.');
});
