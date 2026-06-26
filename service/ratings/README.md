# Ratings service

A tiny anonymous recipe-rating API — the one dynamic piece beside the otherwise
pure-static site. It exists so recipe pages can show a live 5-star average and
earn `aggregateRating` rich results in search. It deliberately breaks the site's
"no runtime server" rule for this one counter; see the top-level `CLAUDE.md`.

## What it is

- **`store.mjs`** — the core: open/migrate the SQLite DB, `ipHash`, `recordVote`,
  `aggregate`, `aggregateAll`, input validation. One row per vote, dedup enforced
  by `UNIQUE(slug, ip_hash)`.
- **`server.mjs`** — a `node:http` server (no framework) exposing the routes
  below. Reads the visitor IP from `X-Forwarded-For` (set by Traefik).
- **`store.test.mjs`** — vitest over the core against an in-memory DB.

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
| POST   | `/api/ratings/:slug`  | `{ value: 1..5 }` | `{ slug, count, average }` (the new aggregate) |

Bad input → `400`; wrong method on a known route → `405`; unknown path → `404`;
over the per-IP throttle → `429`.

## Dedup & privacy

"One rating per person" is **approximated**, not guaranteed — there is no login.
Each vote stores `sha256(ip + RATINGS_IP_SALT)`, never the raw IP, and a
`UNIQUE(slug, ip_hash)` constraint drops a second vote from the same hash on the
same slug. Clearing storage or switching browser **and** network can re-vote;
that's an accepted trade-off for a frictionless one-tap rating.

## Environment

| Var               | Default            | Notes                                            |
| ----------------- | ------------------ | ------------------------------------------------ |
| `RATINGS_IP_SALT` | _(unset)_          | **Required** for POSTs (they 500 until it's set).|
| `RATINGS_DATA`    | `/data/ratings.db` | SQLite file path (a named volume in production). |
| `PORT`            | `8080`             | Listen port.                                     |

## Run locally

```sh
cd service/ratings
npm install
RATINGS_IP_SALT=dev RATINGS_DATA=./dev.db npm start
# then:
curl -X POST localhost:8080/api/ratings/teriyaki-skewers -d '{"value":5}'
curl localhost:8080/api/ratings/teriyaki-skewers
```

Build/push of the container image, the Quadlet unit, and the Traefik routing are
documented in the top-level `README.md` (Deployment) and `deploy/`.
