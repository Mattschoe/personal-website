# CLAUDE.md — Matt's personal site

Standing instructions for building and maintaining this site. This file is the contract for *how*
we build; `SPEC.md` is the contract for *what* it looks like; `PLAN.md` is the sequence of work.

## What this is
A personal site with three content streams — **Recipes**, **Projects**, and a **Blog** — plus a
**Home** page that surfaces the latest item from each. Warm editorial aesthetic, one palette, two
themes (Daylight = light, Twilight = dark). Content is plain Markdown committed to this repo; CI
builds a static site and deploys it as a Docker container to Matt's VPS.

## Stack (decided — do not relitigate without asking)
- **Vite + React + TypeScript.** Function components, hooks. Strict TS.
- **Static site generation** via `vite-react-ssg` (React Router-compatible). Every route, including
  the dynamic content routes, is prerendered to crawlable HTML at build time. The site ships as
  static files — no runtime server, no API.
- **Routing:** React Router (driven through `vite-react-ssg`'s route config).
- **Content:** plain Markdown (`.md`) files in `content/`, loaded at build via `import.meta.glob`,
  front-matter parsed with `gray-matter`, validated with `zod`, rendered with `react-markdown` +
  `remark-gfm`. No MDX, no CMS, no database.
- **Styling:** the design tokens and components from `design-reference/styles.css`, ported
  **verbatim** into the project's global CSS. **No CSS framework, no Tailwind.** Plain CSS with the
  documented custom properties. (CSS Modules are fine for component-scoped rules that aren't already
  in the token sheet, but tokens stay global.)
- **Theme:** `data-theme="dark"` on `<html>`, persisted to `localStorage["matt-theme"]`, applied by
  an inline `<head>` snippet **before paint** to avoid flash. A small React provider/hook wires the
  `[data-theme-toggle]` buttons (port of `design-reference/theme.js`).
- **Deploy:** multi-stage Dockerfile (Node build stage → nginx serving `dist/`). GitHub Actions
  builds and ships to the VPS on push to `main`.

Keep JS minimal. The interactive surface is: theme toggle, mobile nav drawer, and recipe filters.
Nothing else needs client-side state unless the spec says so.

## Ground truth
- **`design-reference/`** is a complete, working HTML mockup of every page. It is the **visual source
  of truth — match it.** Open the pages in a browser to see intended layout and both themes.
- **`design-reference/styles.css`** holds the real design tokens (colors, type, spacing). **Reuse
  these exact values.** Do not invent new colors, fonts, or spacing.
- **`SPEC.md`** is the written design contract: tokens, components, page anatomy, content model.
- **`PLAN.md`** is the phased build plan. Phases are sequential; finish and verify one before the next.

## Rules
1. **Don't redesign.** Reproduce the reference faithfully. If something is ambiguous, ask before deviating.
2. **Tokens, not magic numbers.** Pull every color / size / space / radius / border from the
   documented token set in `styles.css`. No hardcoded hex or px that duplicates a token.
3. **Content is data.** Model Recipes / Projects / Posts with the front-matter in `SPEC.md` §9, typed
   and zod-validated. The Home "Latest" feed is a **date-sorted merge of all three streams,
   generated** from the content layer — never hand-maintained.
4. **Adding content must stay trivial.** The whole point: drop a Markdown file into the right
   `content/` folder, commit, push → it appears on the next deploy. No code changes, no manual
   index edits, no route registration. Anything that breaks this invariant is a bug.
5. **Placeholders stay placeholders.** `.ph` blocks and Lorem Ipsum in the reference mark where real
   assets/copy go. Build a real `<img>` (or a typed placeholder component) at the labelled aspect
   ratio; leave clear TODOs for copy Matt must write. Don't fabricate biographical content.
6. **Accessibility is not a phase you skip.** Keep visible focus styles, semantic landmarks, alt text,
   and honor `prefers-reduced-motion` (the reference already disables transitions under it).

## Project shape (target)
```
content/
  recipes/*.md            one file per recipe   (front-matter per SPEC §9)
  projects/*.md           one file per project
  blog/*.md               one file per post
  assets/                 images referenced by posts (or co-located per item)
public/                   favicon, static OG image, robots.txt
src/
  main.tsx                vite-react-ssg entry
  routes.tsx              route config (static + dynamic content routes)
  styles/tokens.css       ported verbatim from design-reference/styles.css
  content/                content layer: loaders, zod schemas, typed query API
  components/             shared chrome + UI (Header, Footer, ThemeToggle, Card, Tag, ...)
  pages/                  Home, Recipes(index/detail), Projects(...), Blog(...), NotFound
Dockerfile                multi-stage build → nginx
nginx.conf
.github/workflows/deploy.yml
```

## Workflow expectations
- **Verify visually — don't just trust the code.** The look is the deliverable; lint passing is not
  enough. You (the LLM/agent) can and should do this yourself:
  1. Run the dev server (or `preview` on the build).
  2. Drive a headless browser — **Playwright** is the default (`npx playwright`); install it in the
     phase that first needs it. Screenshot each page you touched at a **desktop width (~1280px)** and
     a **mobile width (~390px)**, in **both themes** (toggle `data-theme="dark"` on `<html>`).
  3. **Read the screenshots back** and compare them against the corresponding
     `design-reference/*.html` page opened in the same browser at the same sizes. Match layout,
     type, color, spacing, and hover/focus states.
  4. Iterate until they match; capture a final set of screenshots as evidence the phase is done.
  - The repo `verify` / `run` skills can launch the app; use them if helpful.
- Run `tsc --noEmit` and the linter before declaring a phase done.
- **Commit your work as part of the phase, using [Conventional Commits](https://www.conventionalcommits.org).**
  A phase is not done until it lands as **one or more conventional commits** — don't leave a finished
  phase uncommitted. Group commits logically (e.g. one per coherent unit of work) rather than one
  giant blob.
  - Format: `type(scope): summary`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`,
    `chore`, `build`, `ci`. Scope is the area touched (e.g. `content`, `home`, `theme`, `recipes`,
    `ci`). Examples: `feat(content): add markdown loader and zod schemas`,
    `feat(home): build hero and latest feed`, `ci(deploy): dockerize and add VPS workflow`.
  - End every commit message body with the trailer:
    `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
  - Work on a branch off `main`, not directly on `main`. **Don't push unless asked** — pushing to
    `main` triggers a deploy (Phase 10).
- When a phase is finished, update `PLAN.md` to mark it done and note anything the next phase needs.

## Suggested first steps
See `PLAN.md` — start at Phase 0 and go in order.
