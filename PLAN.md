# PLAN.md — Build plan (helicopter view)

Epic-level, **sequential** plan for building the site. Each phase is sized to be handed to an LLM
that will then produce the detailed implementation plan and write the code for *that phase only*.
Do them in order; each "Done when" must hold before starting the next.

Read `CLAUDE.md` (how we build) and `SPEC.md` (what it looks like) first. `design-reference/` is the
visual source of truth.

**Stack recap:** Vite + React + TS · static generation via `vite-react-ssg` · plain Markdown content
in `content/` · global CSS tokens ported from `design-reference/styles.css` · Dockerized nginx on a
VPS, deployed by GitHub Actions on push to `main`.

Legend: ☐ todo · ☑ done.

---

## ☑ Phase 0 — Project scaffold & tooling
**Goal:** an empty-but-running Vite + React + TS app with the project conventions in place.
**Scope:**
- Initialize Vite (React + TS template) in this repo. Reconcile with the existing `.gitignore` / `LICENSE`.
- Add `vite-react-ssg` and a minimal route config so `npm run build` produces static HTML.
- Tooling: TypeScript strict mode, ESLint + Prettier, npm scripts (`dev`, `build`, `preview`, `lint`, `typecheck`).
- Create the directory skeleton from `CLAUDE.md` (`src/`, `content/`, `public/`).
- Confirm `design-reference/` and `SPEC.md` stay in the repo as reference (not shipped to `dist`).

**Done when:** `npm run dev` serves a placeholder page; `npm run build` emits prerendered static
HTML to `dist/`; lint + typecheck pass clean.

**Done ✅** — Scaffolded Vite 7 + React 19 + TS (strict) with `vite-react-ssg@0.9.0`;
react-router-dom pinned to 6 and Vite to 7 to satisfy the SSG package's peers. Vitest 4 added with
one smoke test; Node pinned to 22 (`.nvmrc` + `engines`). `npm run build` prerenders `/` to static
HTML (`data-server-rendered="true"` in `dist/index.html`); lint/typecheck/test/dev/preview all clean.
**For Phase 1:** ported CSS tokens go in `src/styles/`; Google Fonts `@import` + the pre-paint theme
snippet go into the `index.html` `<head>` (currently a minimal shell). Route config lives in
`src/routes.tsx`; the placeholder page is `src/pages/Placeholder.tsx`.

---

## ☑ Phase 1 — Design tokens & global styles
**Goal:** the entire token system and theme machinery available app-wide, no components yet.
**Scope:**
- Port `design-reference/styles.css` **verbatim** into `src/styles/` (tokens, base, both theme blocks,
  the reusable bits: `.container`, `.kicker`, `.lead`, `.section`, `.tag`, `.btn`, `.arrow-link`,
  `.ph`, responsive + reduced-motion rules). Import globally in the app entry.
- Wire Google Fonts (Bricolage Grotesque, Newsreader, Space Mono) exactly as the reference `@import`.
- Add the inline pre-paint theme snippet to the HTML shell (`index.html` head) so `data-theme` is set
  before first paint (no flash).

**Done when:** a throwaway test page styled only with token classes matches the reference's typography,
colors, and spacing in **both** Daylight and Twilight (toggled manually via `data-theme` on `<html>`).
**Depends on:** Phase 0.

**Done ✅** — Ported the full stylesheet **verbatim** into `src/styles/global.css` (byte-for-byte
identical to `design-reference/styles.css` from the TOKENS block on; verified with `diff`). Only
deviation: the Google Fonts `@import` was dropped from the CSS and the three families are loaded via
`<link rel="preconnect">` + stylesheet in `index.html` `<head>` instead (non-blocking; per the Phase 0
note). `global.css` is imported once at the top of `src/main.tsx`. A pre-paint inline `<script>` in
`index.html` reads `localStorage["matt-theme"]` and sets `data-theme="dark"` before first paint (no
flash). typecheck/lint/build clean; build bundles the CSS (tokens present) and emits the font links +
theme snippet into the prerendered `dist/index.html` `<head>`. Verified visually with Playwright (app
loads tokens/fonts and flips Daylight↔Twilight; reference `design-spec.html` matches in both themes at
1280/390px).
**For Phase 2:** global styles live in `src/styles/global.css` (single global import in `main.tsx` —
add component CSS Modules alongside, but keep tokens here). The pre-paint applier is in `index.html`
`<head>`; Phase 2 ports the **rest** of `design-reference/theme.js` (toggle wiring, sun/moon + label
sync, re-sync on load) as a React provider/hook driving `[data-theme-toggle]` buttons — the inline
snippet only applies the saved theme, it does not wire any toggle.

---

## ☐ Phase 2 — App shell, theming & navigation
**Goal:** the persistent chrome and theme behavior wrapping every route.
**Scope:**
- `Header` (sticky, blurred, hairline border): wordmark, desktop nav with `aria-current`, theme toggle button.
- `Footer`: 3-column (wordmark + blurb, Explore links, Elsewhere links) + bottom bar with the secondary theme toggle.
- **Theme provider/hook** porting `design-reference/theme.js`: toggle, `localStorage["matt-theme"]`
  persistence, sun/moon icon + label sync, re-sync on load. Optionally fall back to
  `prefers-color-scheme` when unset.
- **Mobile nav drawer** (SPEC §11 open item): nav hides < 640px in the reference → build a hamburger
  button + accessible drawer (focus trap, Esc to close, `aria-expanded`).
- Route-level layout wrapper so chrome persists; basic 404 page.

**Done when:** every (stub) route shares header/footer; theme toggle works and persists across reloads
and across routes with no flash; mobile menu opens/closes accessibly.
**Depends on:** Phase 1.

**Done ✅** — Built the persistent chrome. A single **layout route** (`src/routes.tsx` →
`src/components/Layout.tsx`) wraps every page in `ThemeProvider` + `Header` + `<Outlet>` + `Footer`,
with child routes `/`, `/recipes`, `/projects`, `/blog` and a `*` `NotFound`. **Theme** is a React
port of `design-reference/theme.js`: `theme-context.ts` (context + `useTheme`), `ThemeProvider.tsx`
(syncs from `data-theme` on `<html>` after mount — hydration-safe — and owns the flip + localStorage
write), `ThemeToggle.tsx` (header sun/moon icon button, context-driven). The inline pre-paint snippet in
`index.html` stays the source of truth for the *initial* theme. `Header` + `Footer` port the reference
markup/classes; footer socials wired to real GitHub/LinkedIn/email. **Deviations from the reference
(approved by Matt, commit `6c9116d`):** the footer's bottom bar + its secondary "Theme: Daylight" toggle
were dropped (the header toggle is the only one), and the wordmark `.dot` was removed — the
`design-reference/*.html` still show both, so don't re-add them from the reference in a later phase.
**Mobile nav** (≤640px): hamburger opens a **left-aligned dropdown panel under the header**
(`Header.module.css`, tokens only) — Esc/route-change/link-select/resize-past-640px close it, focus
trapped (incl. the close button) + returned to trigger, body-scroll locked, `aria-expanded`/
`aria-controls` wired. The old `Placeholder` page is gone;
each stream has a token-styled stub. typecheck/lint/test (9 tests) clean; `npm run build` prerenders
`/`,`/recipes`,`/projects`,`/blog` to static HTML (each carries header/footer + the pre-paint snippet +
font links). Verified visually with Playwright at 1280/390px in both themes (incl. open drawer + 404);
matches `design-reference/index.html`.
**For Phase 3:** dynamic content routes plug into `src/routes.tsx` as **children of the existing
layout route** (so they inherit the chrome) — generate them from the content layer, don't hand-register.
The `*` `NotFound` child must stay **last**. Note: vite-react-ssg only prerenders concrete paths, so the
404 isn't emitted as a static file (nginx SPA fallback in Phase 10 handles unknown paths). New
component-scoped CSS goes in co-located CSS Modules (see `Header.module.css`); reference global tokens
with `:global(...)` when a rule needs to target a global class like `.container`.

---

## ☐ Phase 3 — Content pipeline  *(the core enabler — get this right)*
**Goal:** the typed Markdown content layer that makes "drop a file → it appears" true.
**Scope:**
- `content/{recipes,projects,blog}/` folders, each holding `.md` files with front-matter per SPEC §9.
- Build-time loader using `import.meta.glob` (eager) + `gray-matter` to read every file.
- **`zod` schemas** for Recipe, Project, Post matching SPEC §9; fail the build loudly on invalid
  front-matter. Auto-derive `readingTime` for posts; auto-derive `slug` from filename if absent.
- Markdown rendering component (`react-markdown` + `remark-gfm`) honoring the `.read` article styles.
- A typed query API: `getRecipes()`, `getProjects()`, `getPosts()`, single-item getters, and
  `getLatestFeed()` — all three streams normalized to `{type,title,date,excerpt,href,tone}`,
  sorted by `date` desc.
- Generate the dynamic route list for `vite-react-ssg` from the content (so new files prerender with
  no manual route edits).
- Seed 2–3 sample `.md` files per stream to develop against (clearly marked sample content).

**Done when:** adding a new `.md` file to a stream folder makes it queryable and gives it a
prerendered route on next build, with zero code changes; bad front-matter fails the build with a
clear message.
**Depends on:** Phase 0 (uses tokens from 1 only when rendered).

---

## ☐ Phase 4 — Home page
**Goal:** the Home page assembled from the content layer.
**Scope:** Hero (eyebrow, title, lead, circular portrait placeholder, quick-links + GitHub/LinkedIn);
**Latest** section = `.featured` card for the newest item across all streams + a 3-up mixed
`feed-grid` of the next items, each tagged by category and pulled from `getLatestFeed()`; About strip
(placeholder copy + CTA buttons — leave copy TODO). Match `design-reference/index.html` exactly.
**Done when:** Home renders real, date-sorted latest content from `content/`; matches the reference in
both themes and at mobile/desktop widths.
**Depends on:** Phases 2, 3.

---

## ☐ Phase 5 — Blog (index + post template)
**Goal:** the Blog stream end to end.
**Scope:** Blog index as editorial post rows (date · title + excerpt · read-time, whole row hovers);
single post = left-aligned header (tag, title, byline), centered lead figure, 680px reading column
with dropcap, tag row, "keep reading" 2-up. Dynamic route `/blog/:slug`, prerendered per post.
Match `design-reference/blog/index.html` and `post.html`.
**Done when:** all posts list and link correctly; each post renders its Markdown body in the reading
column with correct article styling; reading time is accurate.
**Depends on:** Phases 2, 3.

---

## ☐ Phase 6 — Recipes (index + recipe template + functional filters)
**Goal:** the Recipes stream end to end, with working filters (SPEC §11 open item).
**Scope:** Recipes index = 3-up `card` grid + **functional category filter chips** (visual-only in the
reference → make them filter the grid client-side); single recipe = breadcrumb, split hero
(intro + square photo), stat strip (time / yield / effort), 2-col layout with **sticky ingredients
checklist** + **numbered method timeline** + "note" callout. Dynamic route `/recipes/:slug`.
Match `design-reference/recipes/index.html` and `recipe.html`.
**Done when:** recipes list, filter correctly by category, and each detail page renders ingredients +
numbered steps from front-matter/body; matches reference in both themes.
**Depends on:** Phases 2, 3.

---

## ☐ Phase 7 — Projects (index + project template)
**Goal:** the Projects stream end to end.
**Scope:** Projects index = full-width **alternating rows** (status dot, year, title, summary, stack
chips, "case study →"); single project = breadcrumb, title + action buttons (GitHub / demo / docs),
wide screenshot, article body + **sticky spec rail** (role, stack, status, metrics). Dynamic route
`/projects/:slug`. Match `design-reference/projects/index.html` and `project.html`.
**Done when:** projects list in alternating rows; each detail page renders body + spec rail + working
external links from front-matter; matches reference in both themes.
**Depends on:** Phases 2, 3.

---

## ☐ Phase 8 — Real images & assets
**Goal:** replace every `.ph` placeholder with real images, gracefully.
**Scope:** a reusable image component that renders a real `<img>` at the labelled aspect ratio and
falls back to the toned `.ph` placeholder when an item has no image yet (so the site never looks
broken). Decide storage (co-locate per item in `content/.../` or under `public/`). Supply/wire:
portrait (square + 3:4), recipe photos (4:3 / square), project screenshots (16:8), post lead images
(16:8). Favicon + default OG image. `loading="lazy"`, width/height to avoid layout shift.
**Done when:** no raw `.ph` placeholders remain on pages that have real assets; missing images degrade
to a tasteful toned placeholder; no layout shift.
**Depends on:** Phases 4–7.

---

## ☐ Phase 9 — SEO, RSS, sitemap & a11y pass
**Goal:** the site is discoverable, syndicated, and accessible.
**Scope:** per-page `<title>` + meta description + Open Graph/Twitter tags (OG image = item hero),
generated during SSG; `sitemap.xml`; **RSS feed for the blog** (and optionally a combined feed);
optional JSON-LD for articles/recipes; `robots.txt`. Accessibility sweep: visible focus styles,
landmark roles, heading order, alt text, color-contrast spot check, reduced-motion verified.
**Done when:** view-source on each route shows correct prerendered meta; RSS validates; sitemap lists
all routes; a quick Lighthouse/axe pass is clean on SEO + a11y.
**Depends on:** Phases 4–8.

---

## ☐ Phase 10 — Dockerize & CI/CD deploy to VPS
**Goal:** push Markdown to `main` → it's live, with no manual steps.
**Scope:** multi-stage `Dockerfile` (Node build → nginx serving `dist/`); `nginx.conf` (gzip/brotli,
long-cache hashed assets, correct routing for prerendered pages + SPA fallback for unknown paths,
security headers); `docker-compose.yml` for the VPS. GitHub Actions workflow on push to `main`: install
→ typecheck/lint → build → build image → publish (registry or build-on-host) → deploy over SSH
(pull + `compose up -d`). Document required secrets (SSH key/host) and the **"add a post" workflow**
in the README.
**Done when:** committing a new `.md` file to `main` results in the post being live on the VPS after
the pipeline runs, with no other action. Theme, routes, and feeds all work in the deployed container.
**Depends on:** all prior phases (can be bootstrapped earlier as a walking skeleton if desired —
deploying a stub after Phase 2 is a reasonable optional early win).

---

### Notes for whoever picks up a phase
- Stay inside one phase's scope; if you find work that belongs to a later phase, note it here rather
  than doing it early.
- **Verify visually, yourself.** Run the app, drive a headless browser (Playwright), screenshot each
  page you changed at desktop (~1280px) and mobile (~390px) widths in **both themes**, then read the
  screenshots back and compare against the matching `design-reference/*.html` page rendered the same
  way. Iterate until they match. Looks are the deliverable — see `CLAUDE.md` → Workflow expectations.
- The content-adding invariant (Rule 4 in `CLAUDE.md`) is sacred — don't introduce a step that makes
  publishing require code edits.
- **Finish each phase with commits.** A phase is only done once its work is committed as **one or
  more [Conventional Commits](https://www.conventionalcommits.org)** (`type(scope): summary`) — see
  `CLAUDE.md` → Workflow expectations for format and the co-author trailer. Commit on a branch off
  `main`; don't push unless asked.
