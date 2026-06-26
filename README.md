# Matt's personal site

A static personal site with three content streams — **Recipes**, **Projects**, and a **Blog** —
plus a Home page surfacing the latest of each. Built with Vite + React + TypeScript and prerendered
to static HTML with [`vite-react-ssg`](https://github.com/Daydreamer-riri/vite-react-ssg). Content is
plain Markdown committed to this repo. No runtime server, no database.

## Publishing content

This is the whole point — **no code changes required**:

1. Drop a Markdown file into the right stream folder:
   - `content/recipes/<slug>.md`
   - `content/projects/<slug>.md`
   - `content/blog/<slug>.md`
2. Fill in the front-matter. See [`content/README.md`](./content/README.md) for the per-stream field
   tables (required vs. optional, with examples). The filename becomes the slug; `date` is
   `YYYY-MM-DD` and drives ordering and the Home "Latest" feed.
3. **Add an image** (optional): drop the file under `public/images/...` and reference it from
   front-matter by its absolute URL path, e.g. `hero: /images/recipes/<slug>.jpg`. With no `hero`
   the page shows a tasteful toned placeholder, so it's always safe to leave off.
4. Commit and push to `main`.

Front-matter is validated at build time — an unknown or malformed field **fails the build** with a
message naming the file, so typos can't slip through. The next deploy prerenders the new page,
regenerates the Home feed, sitemap, and RSS, and ships a fresh image; the VPS picks it up within
~5 minutes, live with no manual steps.

## Local preview

Check a draft before pushing:

```bash
npm install
npm run dev                      # dev server with HMR
# or, to preview the real prerendered output:
npm run build && npm run preview
```

Other scripts: `npm run typecheck` (tsc), `npm run lint` (eslint), `npm run test` (vitest).

## Deployment

Deployment is **pull-based**: CI builds and publishes the image to GHCR; the VPS pulls it itself via
`podman-auto-update` (no inbound SSH). On push to `main`, GitHub Actions runs typecheck → lint →
test → build, then pushes `ghcr.io/…/personal-website:latest`. On the VPS the image runs as a
rootless-Podman Quadlet unit behind Traefik, serving the prerendered `dist/` from nginx.

Details and the one-time VPS setup live in the deploy files:
[`deploy/`](./deploy/), [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml),
[`Dockerfile`](./Dockerfile), and [`nginx.conf`](./nginx.conf).

### Ratings sidecar

Recipe pages carry a live 5-star rating widget (and emit `aggregateRating` for search). Because a
pure-static site can't hold a shared vote count, a tiny anonymous rating service runs **beside** the
site as a **second container** — see [`service/ratings/`](./service/ratings/). CI builds and pushes
`ghcr.io/…/personal-website-ratings:latest` alongside the site image; the VPS runs it from its own
Quadlet unit ([`deploy/personal-website-ratings.container`](./deploy/personal-website-ratings.container)),
behind Traefik on `mattschoe.dev/api/*`, storing a SQLite database on a named volume (`ratings-data`).

One-time VPS setup, in addition to the site unit:

1. Copy `deploy/personal-website-ratings.container` to
   `~/.config/containers/systemd/personal-website-ratings.container`.
2. Set `RATINGS_IP_SALT=` in that unit to a long random secret (e.g. `openssl rand -hex 32`) and
   keep it stable — POSTs 500 until it's set, and changing it invalidates the per-voter dedup hashes.
3. `systemctl --user daemon-reload && systemctl --user start personal-website-ratings.service`.

The daily CI rebuild bakes the latest aggregates into the static HTML via
[`scripts/fetch-ratings.mjs`](./scripts/fetch-ratings.mjs) (fail-soft: keeps the committed snapshot
on any error), so the SEO numbers track the live widget.
