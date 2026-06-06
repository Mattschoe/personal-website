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

## ☑ Phase 3 — Content pipeline  *(the core enabler — get this right)*
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

**Done ✅** — Content layer lives in `src/content/`: `schema.ts` (strict zod schemas per SPEC §9 +
inferred `Recipe`/`Project`/`Post` types + the `FeedItem` shape), `derive.ts` (pure, dependency-free
helpers — `slug` from filename, posts' `readingTime` at 200 wpm, `excerpt` fallback de-marked from the
first body paragraph, and a `byDateDesc` comparator with a stable secondary-key tiebreak for
deterministic ordering), `parse.ts` (build-only: `gray-matter` + zod; bad front-matter throws
**naming the file** and fails the build), `loader.ts` (freezes + re-exports the pre-parsed arrays),
`index.ts` (typed query API: `getRecipes/Projects/Posts`, single getters, `getLatestFeed(limit?)`
merging all three streams newest-first with tone/href mapping), and `Markdown.tsx` (`react-markdown` +
`remark-gfm` wrapped in `.read`). Schemas are **strict** — unknown keys hard-fail. YAML ergonomics
handled: an unquoted `date:` (parsed by YAML as a Date) is normalised to `YYYY-MM-DD`, and numeric
`year`/ingredient `amount` are coerced to strings. **Content is parsed once at build time** by a Vite
plugin (`vite-plugin-content.ts`) that reads `content/`, validates it, and emits the `virtual:content`
module — so the browser imports pre-parsed data and the YAML parser never enters the client bundle
(app chunk ~256KB vs ~428KB if parsed client-side). **Dynamic routes** are content-driven via
`getStaticPaths` in `src/routes.tsx` (no hand-registration; `*` `NotFound` stays last); minimal
placeholder detail pages (`src/pages/{Recipe,Project,Post}Detail.tsx`) render title + `<Markdown>`
body + a "full template in Phase N" note. **9 seed files** (3/stream, `sample: true`, neutral copy) +
`content/README.md` authoring guide. 34 tests pass (schema strictness/coercion, derive helpers + sort
determinism, query/feed, route-path generation, Markdown SSR→hydrate). typecheck/lint clean;
`npm run build` prerenders all 13 pages incl. one HTML file per content item; invariant proven both
ways (new file → new prerendered route with no code change; bad key → build fails naming the file).
Verified visually with Playwright on `/blog/why-plain-text` at 1280/390 in both themes — markdown
renders with `.read` styling, no hydration errors.
**Gotcha for later phases:** content is parsed in Node by the `virtual:content` plugin, not in the
loader — so `gray-matter`/YAML stay server-side and there's **no Buffer shim** to worry about. New
content streams or front-matter fields need the schema in `schema.ts` *and* a `parse*` function +
`readStream` call in `vite-plugin-content.ts`. Also: detail routes must be reached via **clean URLs**
(`/blog/slug`), not `…/slug.html` — the `.html` suffix becomes part of `:slug` and renders NotFound
(only matters for the dev/preview harness; nginx serves clean URLs in Phase 10).
**For Phase 4:** Home consumes `getLatestFeed(limit)` from `src/content` (featured = item 0, then the
next 3); the detail pages are placeholders awaiting Phases 5–7. Reuse `<Markdown>` from
`src/content/Markdown.tsx` for any rendered bodies. Delete the `sample: true` seed files once real
content exists.

---

## ☑ Phase 4 — Home page
**Goal:** the Home page assembled from the content layer.
**Scope:** Hero (eyebrow, title, lead, circular portrait placeholder, quick-links + GitHub/LinkedIn);
**Latest** section = `.featured` card for the newest item across all streams + a 3-up mixed
`feed-grid` of the next items, each tagged by category and pulled from `getLatestFeed()`; About strip
(placeholder copy + CTA buttons — leave copy TODO). Match `design-reference/index.html` exactly.
**Done when:** Home renders real, date-sorted latest content from `content/`; matches the reference in
both themes and at mobile/desktop widths.
**Depends on:** Phases 2, 3.

**Delivered:** `Home.tsx` rebuilt from `getLatestFeed(4)` (item 0 = featured, 1–3 = feed grid); the
feed is generated, never hand-maintained (Rule 4). Added a deterministic `formatDate(iso, {withYear})`
to `src/content/derive.ts` (splits `YYYY-MM-DD` on `-`, no `new Date(string)`, so build/hydration
strings match and it's timezone-independent) and re-exported it from the content barrel. Home-only
layout ported verbatim into `Home.module.css` (tokens only; global classes targeted via `:global()`).
Hero lead + About body carry literal **TODO** copy markers; "Get in touch" → `mailto:`, socials reuse
Footer's real URLs; `#about` anchor present for the header link; images stay `.ph` placeholders.
Tests: `derive.test.ts` (formatDate incl. TZ-independence) and `Home.test.tsx` (featured = feed[0],
3 cards, tag label/class per type, both date forms, hero TODO, `#about`, mailto). Verified: typecheck
+ lint clean, 48 tests green, `npm run build` bakes the real featured + 3 items and `class="featured"`
into `dist/index.html`, and Playwright screenshots (1280/390px, both themes) match the reference.

**For Phase 5:** the card / feed presentation (`.card`, `.tag--*`, `.card-meta`, `formatDate`) is now
proven against real data and reusable for the Blog index rows. `formatDate` lives in the content
barrel — reuse it for post dates rather than re-deriving. The `#about` link does not yet smooth-scroll
from other routes (anchor only); add a hash handler later if wanted (noted out of scope here). Real
imagery for the `.ph` placeholders remains Phase 8.

---

## ☑ Phase 5 — Blog (index + post template)
**Goal:** the Blog stream end to end.
**Scope:** Blog index as editorial post rows (date · title + excerpt · read-time, whole row hovers);
single post = left-aligned header (tag, title, byline), centered lead figure, 680px reading column
with dropcap, tag row, "keep reading" 2-up. Dynamic route `/blog/:slug`, prerendered per post.
Match `design-reference/blog/index.html` and `post.html`.
**Done when:** all posts list and link correctly; each post renders its Markdown body in the reading
column with correct article styling; reading time is accurate.
**Depends on:** Phases 2, 3.

**Delivered:** `Blog.tsx` rebuilt from `getPosts()` (pre-sorted newest-first) as editorial
`.postRow` links → `/blog/<slug>`; `PostDetail.tsx` rebuilt as the full reading template (crumb →
`Essay` tag + title + byline → 16:8 lead `.ph` → `.read` body → `#tag` row), falling back to
`NotFound` for unknown slugs. Page-specific styles ported verbatim from the reference inline
`<style>` blocks into co-located CSS Modules (`Blog.module.css`, `PostDetail.module.css`, tokens
only, global classes via `:global()`); the core `.read`/`.dropcap`/`.card` etc. already live in
`global.css`. Drop-cap added as an opt-in `dropcap` prop on the shared `<Markdown>` component
(`src/content/Markdown.tsx`) — tags only the first rendered `<p>` with the global `.dropcap` class,
reusing `.dropcap::first-letter`. **Two deviations from the reference, requested by Matt:** no
reading time anywhere (the `.post-read` column + byline read-time are dropped; the `readingTime`
helper stays, just unused in the UI), and no "keep reading" 2-up (the `.next-read` section is omitted
— the post ends cleanly after its tag row). `routes.tsx` unchanged (`/blog` + `/blog/:slug` already
wired in Phase 3). Tests: `Blog.test.tsx` (row-per-post, newest-first, hrefs, dates, no read-time)
and `PostDetail.test.tsx` (tag/crumb/byline, dropcap on first paragraph only, `#`-tag row, no
read-time / no keep-reading, NotFound for bad slug). 64 tests green; typecheck + lint clean;
`npm run build` prerenders `/blog` + one HTML file per post (dropcap baked in, no read-time/keep-
reading markup). Verified visually with Playwright on `/blog` and `/blog/why-plain-text` at 1280/390
in both themes — matches the reference minus the two intended differences.

**For Phase 6/7:** the `.crumb` + detail-page scaffolding (a `.container`-wrapped fragment, no nested
`<main>`; `getX(slug)` → `NotFound` fallback) is now established and reusable for the recipe/project
templates. The `<Markdown dropcap>` prop is blog-only; other streams call `<Markdown>` plain. Real
imagery for the `.ph` placeholders (byline portrait, lead figure) remains Phase 8.

---

## ☑ Phase 6 — Recipes (index + recipe template + functional filters)
**Goal:** the Recipes stream end to end, with working filters (SPEC §11 open item).
**Scope:** Recipes index = 3-up `card` grid + **functional category filter chips** (visual-only in the
reference → make them filter the grid client-side); single recipe = breadcrumb, split hero
(intro + square photo), stat strip (time / yield / effort), 2-col layout with **sticky ingredients
checklist** + **numbered method timeline** + "note" callout. Dynamic route `/recipes/:slug`.
Match `design-reference/recipes/index.html` and `recipe.html`.
**Done when:** recipes list, filter correctly by category, and each detail page renders ingredients +
numbered steps from front-matter/body; matches reference in both themes.
**Depends on:** Phases 2, 3.

**Delivered:** `Recipes.tsx` rebuilt from `getRecipes()` as a 3-up `.card` grid with **functional
filter chips** — the chip list is *derived* from the `category` values present in content (Rule 4;
adding a recipe needs no code edit) and the active filter **syncs to `?category=`** via
`useSearchParams`. To stay hydration-safe the page prerenders unfiltered (all cards in the static
HTML, `All` pressed) and adopts the query only in a post-mount `useEffect` (same "sync after mount"
trick as `ThemeProvider`); chips are `<button aria-pressed>` (a11y over the mockup's `<a>`).
`RecipeDetail.tsx` rebuilt as the full template: `.crumb` → split `.recipe-hero` (tag/title/lead
+ stat strip + square `.ph`) → **rendered Markdown body in a centered `.read` column** → 2-col
`.recipe-body` with a **sticky `.ing-list`** (checkbox bullets, mono amount) + numbered `.steps`
timeline + optional `.note` callout (rendered only when `note` is set). Page styles ported verbatim
from the reference inline `<style>` blocks into co-located CSS Modules (`Recipes.module.css`,
`RecipeDetail.module.css`, tokens only, globals via `:global()`); `.card`/`.tag--recipe`/`.ph`
reuse `global.css`. **Two intentional deviations** (per Matt, mirroring Blog): the index page-head
is minimal (bare "Recipes", no editorial lead) and the detail renders the Markdown body in a
post-style reading column rather than the body-less mockup — `SPEC.md` §8/§11 updated to record
this. Tests: `Recipes.test.tsx` (card-per-recipe, derived chips, filtering, `All` reset,
`?category=` on load, no `<main>`) and `RecipeDetail.test.tsx` (tag/crumb/title, stat strip,
ingredients, ordered steps, note present/absent, body `.read` column, NotFound). 71 tests green;
typecheck + lint clean; `npm run build` prerenders `/recipes` + one HTML per recipe. Verified
visually with Playwright at 1280/390 in both themes (incl. the filter interaction 3→1 + URL update)
— matches the reference minus the two intended differences.

**For Phase 7:** the derived-filter + URL-sync pattern and the crumb/split-hero/stat-strip
scaffolding are now proven, but Projects use **alternating full-width rows** (not a card grid) and a
**sticky spec rail** — little recipe markup carries over beyond the `.crumb` and the clean
page-head convention. Real imagery for the `.ph` placeholders (hero/square photos) remains Phase 8.

---

## ☑ Phase 7 — Projects (index + project template)
**Goal:** the Projects stream end to end.
**Scope:** Projects index = full-width **alternating rows** (status dot, year, title, summary, stack
chips, "case study →"); single project = breadcrumb, title + action buttons (GitHub / demo / docs),
wide screenshot, article body + **sticky spec rail** (role, stack, status, metrics). Dynamic route
`/projects/:slug`. Match `design-reference/projects/index.html` and `project.html`.
**Done when:** projects list in alternating rows; each detail page renders body + spec rail + working
external links from front-matter; matches reference in both themes.
**Depends on:** Phases 2, 3.

**Delivered:** `Projects.tsx` rebuilt from `getProjects()` (pre-sorted newest-first) as full-width
**alternating rows** — the alternation is **pure CSS** (`:nth-child(even)` flips the columns + media
order), so the JSX stays uniform and adding a project needs no code edit (Rule 4). `ProjectDetail.tsx`
rebuilt as the full case-study template: `.crumb` → head (`Project` tag + mega title + summary lead +
**action buttons**) → 16:8 `.ph` screenshot → 2-col `.proj-layout` with the rendered Markdown body in a
`.read` article (widened to fill the column) beside a **sticky `.spec` rail** (Stack / Role / Status /
Year / Numbers). Action buttons are **conditional** on `project.links` (repo→accent "View on GitHub",
demo→"Live demo", docs→"Read the docs"), each `target="_blank" rel="noopener noreferrer"`; the whole
`.proj-actions` wrapper and the `Numbers` block render only when their data is present. Page styles
ported verbatim from the reference inline `<style>` blocks into co-located CSS Modules
(`Projects.module.css`, `ProjectDetail.module.css`, tokens only, globals via `:global()`); `.ph`,
`.btn`, `.tag--project`, `.card-meta`/`.card-excerpt`, `.arrow-link` reuse `global.css`.
**Two conventions kept (per Matt, mirroring Blog/Recipes):** the index page-head is minimal (bare
"Projects", no editorial headline/lead) and the case-study body renders **plain — no dropcap** (the
`<Markdown dropcap>` prop stays blog-only). The detail page uses `<div className="container">` (no
nested `<main>` — Layout owns that landmark). `routes.tsx` unchanged (`/projects` + `/projects/:slug`
already wired in Phase 3). Tests: `Projects.test.tsx` (row-per-project, newest-first, hrefs, title/
summary/status/year/stack, bare head/no lead, no `<main>`) and `ProjectDetail.test.tsx` (crumb/tag/
title/lead, action buttons per present link + external attrs, conditional absence, spec rail fields,
`Numbers` present/absent, body `.read` with no dropcap, no `<main>`, NotFound). 69 tests green;
typecheck + lint clean; `npm run build` prerenders `/projects` + one HTML per project (verified the
built HTML carries the spec rail + the right action buttons, `Numbers` only when metrics set, and **no
dropcap**). Verified visually with Playwright at 1280/390 in both themes — index alternating rows +
status dots + stack chips, detail head/buttons/16:8 shot/sticky spec rail, and the ≤880px collapse
(rows → single column, spec rail → static wrapping row) all match the reference.

**For Phase 8:** the `.ph` placeholders still to be replaced with real imagery are the project
**screenshots** — the index row media (`Project screenshot`) and the detail **16:8** hero
(`Primary screenshot · 16:8`). With Projects done, every content stream now has its real template, so
Phase 8 can wire a shared image component across recipes/posts/projects/portrait at once. Note this
phase branched off `main` (Phase 6/Recipes was still an unmerged PR); Projects and Recipes touch
disjoint files, so the PRs merge independently.

---

## ☑ Phase 8 — Real images & assets
**Goal:** replace every `.ph` placeholder with real images, gracefully.
**Scope:** a reusable image component that renders a real `<img>` at the labelled aspect ratio and
falls back to the toned `.ph` placeholder when an item has no image yet (so the site never looks
broken). Decide storage (co-locate per item in `content/.../` or under `public/`). Supply/wire:
portrait (square + 3:4), recipe photos (4:3 / square), project screenshots (16:8), post lead images
(16:8). Favicon + default OG image. `loading="lazy"`, width/height to avoid layout shift.
**Done when:** no raw `.ph` placeholders remain on pages that have real assets; missing images degrade
to a tasteful toned placeholder; no layout shift.
**Depends on:** Phases 4–7.

**Delivered:** A reusable `<Image>` component (`src/components/Image.tsx` + `.module.css`) that renders
a real `<img>` (`loading="lazy"`, `decoding="async"`, `object-fit:cover`) from an item's `hero` and
**gracefully falls back to the existing toned `.ph` placeholder** when `hero` is unset — same caption,
glyph and tone as before, so a page never looks broken. The component's root is always the `.ph`
element, so every per-page `:global(.ph)` sizing/shape override (aspect ratios, circular crop,
min-heights) keeps working unchanged; one global `.ph > img` rule (`global.css`) fills the box with
**no layout shift** (the box's size still comes from CSS aspect-ratio). Every `.ph` slot across Home
(portrait, featured, feed cards, about portrait), the recipe/project/blog index cards+rows, and the
recipe/project/post detail heroes now goes through `<Image>` (the 32px byline avatar stays a bare
`.ph` span — no per-post avatar field). **Decisions (with Matt):** storage = **`public/images/...`**
(absolute URL paths in front-matter; zero build plumbing, preserves Rule 4 — drop a file + set
`hero:`); **no real photos shipped yet** (Matt has none — every slot renders its placeholder until a
`hero:` is added); **favicon + OG image deferred to Phase 9** with the rest of the SEO/meta work.
Content layer: added optional `heroAlt` to the shared schema base and `hero?`/`heroAlt?` to `FeedItem`;
the feed mappers pass both through (alt falls back to the item `title`; decorative portraits use empty
alt). Docs updated (`content/README.md` Images section + `SPEC.md` §9 / open-items). **91 tests green**
(new `Image.test.tsx`: img-vs-placeholder rendering, lazy/async, no caption/glyph when imaged, empty
alt, className passthrough; + schema `hero/heroAlt` and feed pass-through). typecheck + lint clean;
`npm run build` prerenders all 13 routes. **Invariant proven** by temporarily wiring a sample SVG +
`hero:` onto one item per stream: the `<img>` rendered at the right ratio (16:10 featured, 4:3 cards,
square/16:8 heroes) and covered the box with **no layout shift**, while un-imaged items kept their
placeholders — verified with Playwright at 1280/390px in **both themes**, then fully reverted (no
sample images ship).

**For Phase 9:** `hero`/`heroAlt` are the OG-image + alt sources for per-page meta. Favicon + default
OG image still to create. `public/images/.gitkeep` holds the documented image folder. When Matt
supplies real photos, dropping a file in `public/images/` + setting `hero:` is all it takes — no code
change.

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
