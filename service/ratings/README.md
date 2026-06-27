# Ratings service

A tiny anonymous recipe-rating API — the one dynamic piece beside the otherwise
pure-static site. It exists so recipe pages can show a live 5-star average and
earn `aggregateRating` rich results in search. It deliberately breaks the site's
"no runtime server" rule for this one counter; see the top-level `CLAUDE.md`.

## What it is

- **`store.mjs`** — the core: open/migrate the SQLite DB, `ipHash`, `recordVote`,
  `aggregate`, `aggregateAll`, input validation. One row per voter+slug, dedup
  enforced by `UNIQUE(slug, voter_id)`; `recordVote` upserts, so a repeat vote
  from the same token updates its value (a visitor can change their rating).
  `openDb` migrates a pre-`voter_id` database forward, preserving old rows.
- **`server.mjs`** — a `node:http` server (no framework) exposing the routes
  below. Stores `ipHash` (from `X-Forwarded-For`) only as a soft abuse signal.
  Exports `createRatingsServer({ db, salt, readLimit, writeLimit })` (it only
  binds a port when run directly), so the routes are unit-testable.
- **`store.test.mjs`** / **`server.test.mjs`** — vitest over the core and the
  HTTP surface against an in-memory DB.

Storage is **SQLite** via `better-sqlite3` (the only dependency). It's the one
native dep in the repo, which is why this service has its **own** `package.json`
and is **excluded from the root vitest** — it must never reach the frontend's
`npm ci`/Docker build. Run its tests from this directory:

```sh
cd service/ratings && npm install && npm test
```

## Routes

| Method | Path                  | Body            | Response                                  |
| ------ | --------------------- | --------------- | ----------------------------------------- |
| GET    | `/healthz`            | —               | `{ ok: true }`                            |
| GET    | `/api/ratings`        | —               | `{ generatedAt, ratings: { [slug]: { count, average } } }` |
| GET    | `/api/ratings/:slug`  | —               | `{ slug, count, average }`                |
| POST   | `/api/ratings/:slug`  | `{ value: 1..5, voterId }` | `{ slug, count, average }` (the new aggregate) |

Bad input → `400`; wrong method on a known route → `405`; unknown path → `404`;
over the throttle → `429`.

The throttle is a **coarse safety valve, not a per-visitor limiter**: in
production every visitor shares one IP (Podman SNAT, see below), so its per-IP
bucket degrades to one global bucket. The caps are therefore generous and split
read/write (reads ~600/10s, writes ~60/10s) so a normal traffic burst never
`429`s a real visitor — it only blunts a runaway loop.

## Dedup & privacy

"One rating per person" is **approximated**, not guaranteed — there is no login.
Dedup keys on an **anonymous voter token**: the browser mints a UUID in
`localStorage` and sends it as `voterId`; `UNIQUE(slug, voter_id)` + an upsert
means a fresh token adds a vote and a returning token updates its own (the
original `created_at` is preserved across re-votes). Clearing storage — or
private browsing, which mints a token per session — counts as a new voter: the
accepted trade-off for a frictionless one-tap rating.

By the same token, **vote-stuffing by minting fresh `voterId`s (e.g. via curl)
is possible and accepted.** With every visitor sharing one IP there is no robust
server-side per-voter cap; the write throttle only blunts a casual loop. A
stuffed recipe is just a badly-rated recipe — `aggregateRating` is still only
emitted when ≥1 real rating exists (never fabricated), and the daily-cron
snapshot bounds the SEO exposure.

The client **IP is not trusted** here: the production VPS runs rootless Podman,
whose port forwarder rewrites every connection's source to one internal address
before Traefik, so all visitors would hash to the same value. We still store
`sha256(ip + RATINGS_IP_SALT)` (never the raw IP) as a non-unique, best-effort
abuse/throttle signal, but it never gates a vote.

## Environment

| Var               | Default            | Notes                                            |
| ----------------- | ------------------ | ------------------------------------------------ |
| `RATINGS_IP_SALT` | _(unset)_          | Optional. Salts the soft `ip_hash` signal; unset → `ip_hash` is empty (POSTs still work). |
| `RATINGS_DATA`    | `/data/ratings.db` | SQLite file path (a named volume in production). |
| `PORT`            | `8080`             | Listen port.                                     |

## Run locally

```sh
cd service/ratings
npm install
RATINGS_IP_SALT=dev RATINGS_DATA=./dev.db npm start
# then (voterId is any token matching ^[A-Za-z0-9_-]{8,64}$):
curl -X POST localhost:8080/api/ratings/teriyaki-skewers -d '{"value":5,"voterId":"local-dev-token"}'
curl localhost:8080/api/ratings/teriyaki-skewers
```

Build/push of the container image, the Quadlet unit, and the Traefik routing are
documented in the top-level `README.md` (Deployment) and `deploy/`.
