# Personal site

An almost static personal site with three content streams — **Recipes**, **Projects**, and a **Blog** —
plus a Home page surfacing the latest of each. Built with Vite + React + TypeScript and prerendered
to static HTML with [`vite-react-ssg`](https://github.com/Daydreamer-riri/vite-react-ssg). Content is
plain Markdown committed to the repo.

## Publishing content

1. Drop a Markdown file into the right stream folder:
   - `content/recipes/<slug>.md`
   - `content/projects/<slug>.md`
   - `content/blog/<slug>.md`
2. Fill in the front-matter. See [`content/README.md`](./content/README.md) for the per-stream field
   tables (required vs. optional, with examples). The filename becomes the slug; `date` is
   `YYYY-MM-DD` and drives ordering and the Home "Latest" feed.
3. **Add an image** (optional): drop the file under `public/images/...` and reference it from
   front-matter by its absolute URL path, e.g. `hero: /images/recipes/<slug>.webp`. With no `hero`
   the page shows a tasteful toned placeholder, so it's always safe to leave off. See
   [Images](#images) for the optimization step.
4. Commit and push.

Front-matter is validated at build time, an unknown or malformed field **fails the build** with a
message naming the file, so typos can't slip through. The build prerenders the new page and
regenerates the Home feed, sitemap, and RSS automatically.

## Images

Source images aren't committed raw — only optimized `.webp` is. Drop a `.jpg`/`.jpeg`/`.png` (or any
non-`.webp`) under `public/images/...` and run:

```bash
npm run images
```

This walks `public/images/`, writes a compressed sibling `.webp` for every non-`.webp` it finds
(resized to ≤1600px, quality 80), and skips anything already converted. Reference the resulting
`.webp` from your content. The raw sources are gitignored; the `.webp` outputs are what you commit.
(The script self-bootstraps `sharp` via a no-save install, so there's nothing to add to
`package.json`.)

## Local development

```bash
npm install
npm run dev                      # dev server with HMR
# or, to preview the real prerendered output:
npm run build && npm run preview
```

Other scripts: `npm run typecheck` (tsc), `npm run lint` (eslint), `npm run test` (vitest),
`npm run images` (optimize images — see above).

## Deployment

The site is just static files, so it can be served by anything — Netlify, Vercel, GitHub Pages, an
S3 bucket, or your own box. `npm run build` writes the complete site (prerendered HTML + sitemap +
RSS) to `dist/`; point any static host at that directory and you're done.

This repo also ships a container-based, **pull-based** setup as a reference:

- [`Dockerfile`](./Dockerfile) + [`nginx.conf`](./nginx.conf) — a multi-stage build that compiles
  the site and serves `dist/` from nginx.
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) — on push to `main`, runs
  typecheck → lint → test → build, then publishes the image to GHCR. A daily cron rebuild refreshes
  the baked-in snapshots (GitHub activity and rating aggregates).
- [`deploy/`](./deploy/) — example [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
  units and a `podman-auto-update` timer override, so a host can pull and roll the new image itself
  with no inbound SSH. Adapt these to your own host, reverse proxy, and domain.
- [`docker-compose.yml`](./docker-compose.yml) — local runs only (site + ratings sidecar), for
  parity with production. Not the production deployment.

### Ratings sidecar

Recipe pages carry a live 5-star rating widget (and emit `aggregateRating` for search). Because a
pure-static site can't hold a shared vote count, a tiny anonymous rating service runs **beside** the
site as a **second container** — see [`service/ratings/`](./service/ratings/). It's zero-framework
Node with a SQLite store, votes are anonymous (an in-browser voter token, no login), and the CI
workflow builds and publishes its image alongside the site's.

To run it, put the service behind your reverse proxy on the **same origin** as the site under
`/api/*` (so there's no CORS), give it a persistent volume for the SQLite file, and set
`RATINGS_IP_SALT` to a long random secret (e.g. `openssl rand -hex 32`). Dedup keys on the anonymous
voter token, not the IP, so that salt only seasons a soft `ip_hash` abuse signal — votes still work
if it's unset. [`deploy/personal-website-ratings.container`](./deploy/personal-website-ratings.container)
is a worked example of all three.

The widget and SEO numbers are **fail-soft**: if the sidecar isn't running, the widget falls back to
the baked snapshot and the site is otherwise unaffected. The daily CI rebuild bakes the latest
aggregates into the static HTML via [`scripts/fetch-ratings.mjs`](./scripts/fetch-ratings.mjs), so
the `aggregateRating` markup tracks the live widget. If you don't want ratings at all, drop the
sidecar and the widget quietly stays on the snapshot (which starts empty).
