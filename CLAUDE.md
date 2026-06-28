# CLAUDE.md — Matt's personal site

Standing instructions for maintaining this site. The phased build is finished; this file is the
contract for *how* we work on it now. For *what* the content fields are, see
[`content/README.md`](./content/README.md).

## What this is
A personal site with three content streams — **Recipes**, **Projects**, and a **Blog** — plus a
**Home** page that surfaces the latest item from each. Warm editorial aesthetic, one palette, two
themes (Daylight = light, Twilight = dark). Content is plain Markdown committed to this repo; CI
builds a static site, ships it as a container image to GHCR, and the VPS pulls it.

## Stack (decided — do not relitigate without asking)
- **Vite + React + TypeScript.** Function components, hooks. Strict TS.
- **Static site generation** via `vite-react-ssg` (React Router-compatible). Every route, including
  the dynamic content routes, is prerendered to crawlable HTML at build time. The site ships as
  static files — no runtime server, no API. **One deliberate exception:** a tiny ratings sidecar
  (see below) runs beside the static site to hold recipe star votes; the frontend stays static.
- **Routing:** React Router, driven through `vite-react-ssg`'s route config (`src/routes.tsx`).
- **Content:** plain Markdown (`.md`) files in `content/`, parsed at build time by the
  `virtual:content` Vite plugin (`vite-plugin-content.ts` → `src/content/parse.ts`), front-matter
  validated with `zod`, rendered with `react-markdown` + `remark-gfm`. No MDX, no CMS, no database.
- **Styling:** plain CSS with the design tokens in `src/styles/global.css`. **No CSS framework, no
  Tailwind.** Component-scoped rules live in CSS Modules (`*.module.css`); tokens stay global.
- **Theme:** `data-theme="dark"` on `<html>`, persisted to `localStorage["matt-theme"]`, applied by
  an inline `<head>` snippet **before paint** to avoid flash. A small React provider/hook
  (`ThemeProvider`) wires the `[data-theme-toggle]` buttons.
- **Deploy:** multi-stage Dockerfile (Node build stage → nginx serving `dist/`). GitHub Actions
  builds and pushes the image to GHCR on push to `main`; the VPS pulls via `podman-auto-update`.
- **Ratings sidecar (the one dynamic exception — decided, do not relitigate).** Recipe pages show a
  live 5-star widget and emit schema.org `aggregateRating`. A shared, cross-visitor vote count is
  impossible in a pure-static site, so a tiny zero-framework Node service (`service/ratings/`,
  SQLite via `better-sqlite3`) runs **beside** the static frontend on the VPS, its own container +
  Quadlet unit, routed by Traefik on `Host(mattschoe.dev) && PathPrefix(/api)` (same origin, no
  CORS). It's **anonymous (no auth)**: one tap, no login, and the vote is **changeable** (re-tap a
  different star). "One vote per person" is *approximated* by an **anonymous voter token** — a UUID
  the browser mints in `localStorage` (`matt-voter-id`) and sends with each vote; the server upserts
  on `UNIQUE(slug, voter_id)`, so a re-vote updates the row. **Not** IP-based: the VPS runs rootless
  Podman, whose port forwarder SNATs every connection to one internal address before Traefik, so all
  visitors share one IP — `ip_hash` is therefore stored only as a non-unique, best-effort abuse
  signal and never gates a vote. Clearing storage mints a new token (counts as a new voter) — never
  guaranteed. Card badges (`RecipeRatingBadge`) read the baked snapshot for SSG and live-upgrade via
  one `/api/ratings` fetch per listing page (`useAllRatings`), fail-soft.
  `aggregateRating` is baked at build time from `src/data/ratings.json` (refreshed by the daily CI
  cron, like the GitHub-activity snapshot) and emitted **only when ≥1 real rating exists** — never
  fabricated. `better-sqlite3` is native and lives **only** in `service/ratings/package.json` (never
  the root, or it breaks the frontend `npm ci`/Docker build); that service has its own tests and is
  excluded from the root vitest.

Keep JS minimal. The interactive surface is: theme toggle, mobile nav drawer, and recipe filters.
Nothing else needs client-side state unless a change genuinely calls for it.

## Working rules
1. **Tokens, not magic numbers.** Pull every color / size / space / radius / border from the token
   set in `src/styles/global.css`. No hardcoded hex or px that duplicates a token.
2. **Content is data.** Recipes / Projects / Posts are modelled by the zod-validated front-matter in
   `src/content/schema.ts`. The Home "Latest" feed is a **date-sorted merge of all three streams,
   generated** from the content layer (`src/content/feed.ts`) — never hand-maintained.
3. **Adding content stays a zero-code-change operation.** Drop a Markdown file into the right
   `content/` folder, commit, push → it appears on the next deploy. No code changes, no manual index
   edits, no route registration. Anything that breaks this invariant is a bug.
4. **Images are real `<img>` or typed placeholders.** Use the `Image` component at the labelled
   aspect ratio; when `hero` is unset it falls back to a toned `.ph` placeholder. Leave clear TODOs
   for copy Matt must write; don't fabricate biographical content.
5. **Accessibility is not optional.** Keep visible focus styles, semantic landmarks, alt text, and
   honor `prefers-reduced-motion` (global CSS already disables transitions under it).

## Workflow
- Run `npm run typecheck`, `npm run lint`, and `npm run test` before declaring work done — and
  `npm run build` for anything touching the content layer, routes, or SEO generation.
- **Tests are first-class and decoupled from `content/`.** The suite runs against fixed fixtures in
  `src/test/fixtures.ts`, aliased over `virtual:content` for tests in `vite.config.ts`. Do **not**
  recouple tests to author content under `content/`; when content-shaped coverage is needed, extend
  the fixtures (final loaded shape) or parse inline raw-markdown strings (see
  `src/content/parse.test.ts`). Anything with logic worth getting right gets a test in the same
  change.
- **Verify visually when the look changes — use the committed helper, don't re-derive Playwright.**
  `scripts/screenshot.mjs` shoots a route at desktop (1280px) + mobile (390px) in both themes; read
  the PNGs back. Steps that otherwise get rediscovered each time (and cost tokens):
  ```sh
  npm run build && npm run preview &        # serves :4173 (or `npm run dev` → :5173)
  npm install --no-save playwright-core      # JS client only; Chromium is cached in ~/.cache/ms-playwright
  node scripts/screenshot.mjs / home "section[aria-labelledby='up-to-heading']"
  #                            ^route ^prefix ^optional CSS selector to clip to
  # → /tmp/home-{desktop,mobile}-{light,dark}.png   (override host with BASE_URL=…)
  ```
  Gotchas baked into the script: playwright-core is **CommonJS** (import via `createRequire`); resolve
  Chromium from the cache (never `npx playwright install`); toggle dark theme **after** load or the
  pre-paint snippet overwrites it. When done, stop the preview server.
- **Commit as [Conventional Commits](https://www.conventionalcommits.org).** Format
  `type(scope): summary` (types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
  `build`, `ci`; scope is the area touched, e.g. `content`, `home`, `theme`, `recipes`, `ci`). End
  every commit body with the trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Branch off `main`; don't push to `main`.** Pushing to `main` triggers a deploy. Work on a branch,
  push the branch, and open a PR into `main` (`gh pr create`) summarizing the change and how it was
  verified. Leave the merge to Matt unless he says otherwise.

## Codebase map (source of truth)
**Do not launch exploration/search agents to rediscover the codebase. This tree is the source of
truth for what exists and where. Read the specific file you need directly; only fall back to
searching if the tree is demonstrably stale (a file here is missing, or a file exists that isn't
listed) — and fix this tree when that happens.**

```
content/                        author content — drop a .md in, commit, push (zero-code-change)
  README.md                     per-stream front-matter field tables (the content reference)
  recipes/*.md                  one file per recipe
  projects/*.md                 one file per project
  blog/*.md                     one file per post
  assets/                       images co-located with content (currently a .gitkeep)
public/                         static assets copied verbatim into dist/
  robots.txt                    points crawlers at the sitemap
  images/**/*.webp              optimized hero/inline images referenced from content via `hero:`/`![]()` — only the .webp is committed; raw .jpg/.jpeg/.png sources are gitignored (run `npm run images` to (re)generate, see scripts/optimize-images.mjs)
src/
  main.tsx                      vite-react-ssg entry
  routes.tsx                    route config; content routes derive getStaticPaths from the streams
  routes.test.ts                asserts one prerendered path per content file
  setupTests.ts                 vitest/jsdom setup
  vite-env.d.ts                 Vite client types
  components/
    Layout.tsx                  app shell: owns the single <main> landmark
    Header.tsx / .module.css    site header + mobile nav drawer
    Footer.tsx                  site footer
    ThemeProvider.tsx           pre-paint theme provider; persists to localStorage
    theme-context.ts            theme React context
    ThemeToggle.tsx             [data-theme-toggle] button
    Image.tsx / .module.css     real <img> or toned .ph placeholder at a fixed aspect ratio
    WhatImUpTo.tsx / .module.css  Home "What I'm up to": GitHub month timeline + year heatmap (tokens)
    recipe-rating.ts            pure localStorage helpers: this browser's own votes + anonymous voter token (getVoterId)
    useRecipeRating.ts          hook: seed from snapshot, fetch live /api numbers, submit/change a vote (fail-soft)
    useAllRatings.ts            hook: one /api/ratings fetch per listing page, seeded from snapshot (fail-soft) — feeds card badges
    RecipeRating.tsx / .module.css  the 5-star widget (fractional fill + count); interactive (cast or change your vote)
    RecipeRatingBadge.tsx / .module.css  compact read-only card rating; live `rating` prop over the baked snapshot
  data/                         build-time snapshots baked into the prerendered HTML
    github-activity.json        committed snapshot/fallback (fetched in CI; see scripts/)
    github-activity.ts          typed loader + pure heatmap derivations (cellLevel/levelThresholds)
    ratings.json                committed recipe-ratings snapshot/fallback (fetched in CI; starts empty)
    ratings.ts                  typed loader + getRating + pure starFill derivation
  content/                      the content layer
    schema.ts                   zod front-matter schemas + the final Recipe/Project/Post/FeedItem types
    parse.ts                    build-time parse + validate + derive (Node only; imports gray-matter)
    parse.test.ts               parse/validate/derive coverage over inline raw markdown
    derive.ts                   pure helpers: slug, excerpt, readingTime, date format, sort
    read.node.ts                Node reader over content/; used by the Vite plugin and SEO generator
    loader.ts                   freezes + re-exports the parsed arrays from `virtual:content`
    content.d.ts                types for the `virtual:content` module
    feed.ts                     normalises each stream into FeedItem + the date-sorted merge
    index.ts                    typed query API (getRecipes/…, getLatestFeed) — the only API pages use
    Markdown.tsx                react-markdown + remark-gfm renderer
    *.test.ts(x)                loader / query / derive / schema / Markdown tests
  pages/                        one component (+ .module.css + .test.tsx) per page
    Home / Recipes / RecipeDetail / Projects / ProjectDetail / Blog / PostDetail / NotFound
  seo/
    config.ts                   siteConfig (canonical URL, titles)
    meta.ts / Seo.tsx           per-page meta + <Seo> component
    feeds.ts                    sitemap + RSS + combined-feed XML builders
    generate.ts                 build-time writer; reads content via read.node.ts, writes into dist/
    *.test.ts(x)                meta / feeds / Seo tests
  styles/
    global.css                  design tokens + global element/.ph rules (the token sheet)
    app.css                     app-shell structure not in the token sheet
  test/
    fixtures.ts                 fixed typed dataset aliased over `virtual:content` for tests
service/ratings/                the dynamic ratings sidecar (own package.json; native dep; not in root vitest)
  store.mjs                     SQLite core: openDb(+migrate)/recordVote(upsert on voter_id)/aggregate + validation; ipHash is a soft signal
  server.mjs                    node:http server: GET/POST /api/ratings[/:slug], /healthz (no framework)
  store.test.mjs                vitest over the core against an in-memory DB (`cd service/ratings && npm test`)
  Dockerfile / package.json / README.md   two-stage alpine image; better-sqlite3 only dep
scripts/                        Node build/dev utilities (not bundled)
  fetch-github-activity.mjs     CI: fetch GitHub contribution data → src/data/github-activity.json (fails soft)
  fetch-ratings.mjs             CI: fetch live ratings → src/data/ratings.json (fails soft; mirrors the above)
  optimize-images.mjs           `npm run images`: every non-.webp under public/images/ → compressed sibling .webp (≤1600px, q80); self-bootstraps sharp via npm install --no-save (native, never in package.json); skips existing .webp; has its own test
  screenshot.mjs                visual-verify helper: route × {desktop,mobile} × {light,dark} → /tmp PNGs
vite-plugin-content.ts          the `virtual:content` plugin: parses content/ at build time
vite.config.ts                  Vite + Vitest config (test aliases + service/** excluded from the suite)
index.html                      Vite HTML entry with the pre-paint theme snippet
Dockerfile / nginx.conf         multi-stage build → nginx serving dist/
docker-compose.yml              local runs only, not production (site + ratings sidecar for parity)
deploy/                         Quadlet units (site + ratings) + podman-auto-update timer override for the VPS
.github/workflows/deploy.yml    CI (on push + daily cron): checks → fetch GitHub activity + ratings → build & push both images to GHCR
README.md                       content-publishing guide + deployment pointer
AGENTS.md                       byte-identical mirror of this file
```

## Content reference
The per-stream front-matter fields (required/optional, examples) live in
[`content/README.md`](./content/README.md). Consult it rather than duplicating the tables here.
