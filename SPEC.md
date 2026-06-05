# Matt's Personal Site — Design Spec

> Source of truth for the build. The HTML files in this folder are the **visual reference
> implementation**; `styles.css` holds the real design tokens. Match them.

## 1. What this is
A personal site with three content streams — **Recipes**, **Projects**, and a **Blog** — plus a
**Home** page that surfaces the latest item from each. Warm editorial aesthetic. One palette,
two themes (Daylight = light, Twilight = dark) toggled in the header and persisted in
`localStorage["matt-theme"]`.

## 2. Stack
The reference is plain HTML + one CSS file + a tiny vanilla theme script (no build step) so it
drops into any framework. Pick whatever you're building in — the design is framework-agnostic.
Whatever the target (Astro/Eleventy/Next static, or Compose, etc.), keep these principles:
- **Content-driven:** one collection per stream, sorted by date. The Home "Latest" feed is a
  date-sorted *merge* of all three — never hand-maintained.
- **Theme via design tokens / CSS custom properties** exactly as in `styles.css`. Don't add a CSS framework.
- **Ship minimal JS.** The only required script is the theme toggle.

## 3. File map (reference)
```
index.html              Home — hero + "Latest" merged feed + about strip
styles.css              All tokens, both themes, every component
theme.js                Theme toggle + localStorage persistence
recipes/index.html      Filterable recipe grid
recipes/recipe.html     Single recipe (ingredients + method)   ← template
projects/index.html     Project list (alternating rows)
projects/project.html   Single project / case study            ← template
blog/index.html         Post list (editorial rows)
blog/post.html          Single post (reading column)           ← template
design-spec.html        Styled version of this spec (browsable)
```
Single-item pages are **templates** → dynamic routes (`/recipes/[slug]`, etc.) in the real build.

## 4. Color
One raw palette, constant across themes. Semantic tokens remap per theme.

**Raw palette**
| Name | Token | Hex |
|---|---|---|
| Darlington (sage) | `--sage` | `#ACCAB2` |
| Beeswax | `--beeswax` | `#E9A752` |
| Grenadine | `--grenadine` | `#D44720` |
| Café Latte | `--latte` | `#78614D` |

**Daylight (default)**
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--bg` | `#F6EEDF` | | `--ink` | `#2B2017` |
| `--bg-2` | `#EFE4CF` | | `--ink-soft` | `#6A5A48` |
| `--surface` | `#FFFDF8` | | `--line` | `#E0D2BA` |
| `--accent` | `#D44720` | | `--line-strong` | `#2B2017` |
| `--c-recipe` | `#D44720` | `--c-project` | `#4E7C5C` | `--c-essay` `#B97E1E` |

**Twilight (dark — `[data-theme="dark"]`)**
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--bg` | `#201914` | | `--ink` | `#F2E7D4` |
| `--bg-2` | `#181210` | | `--ink-soft` | `#B6A084` |
| `--surface` | `#2B2017` | | `--line` | `#3C2F24` |
| `--accent` | `#E9A752` | | `--line-strong` | `#F2E7D4` |
| `--c-recipe` | `#D44720` | `--c-project` | `#ACCAB2` | `--c-essay` `#E9A752` |

**Category color-coding** (on the tag/pill of each item):
Recipe → Grenadine · Project → Sage · Essay → Beeswax.
On Daylight, sage/beeswax are darkened (`--c-project`, `--c-essay`) for legible text on light paper.

## 5. Typography
Loaded from Google Fonts.
| Role | Family | Weights | Used for |
|---|---|---|---|
| Display | **Bricolage Grotesque** | 700 / 800 | H1–H4, wordmark, card titles |
| Body | **Newsreader** | 400 / 500 + italic | Paragraphs, leads, article text |
| Mono | **Space Mono** | 400 / 700 | Kickers, tags, dates, nav, buttons |

**Fluid scale (clamp):** `--fs-mega` 3.2→6rem · `--fs-h1` 2.4→3.75rem · `--fs-h2` 1.8→2.6rem ·
`--fs-h3` 1.35→1.7rem · `--fs-lead` 1.15→1.4rem · `--fs-body` 1.075rem · `--fs-meta` 0.74rem.
Headings: `letter-spacing:-.02em`, `line-height:1.02`, `text-wrap:balance`. Body: `line-height:1.62`,
`text-wrap:pretty`. Reading column maxes at **680px**; page container at **1180px**.

## 6. Spacing & form
- **Spacing scale:** `--s-1`…`--s-9` = .25 / .5 / .75 / 1 / 1.5 / 2 / 3 / 4.5 / 7 rem. Sections use `padding-block: --s-8`.
- **Layout:** always `flex`/`grid` + `gap` for groups, never inter-sibling margins.
- **Radius:** crisp — `4px` default, `8px` cards, `999px` pills. Editorial, not bubbly.
- **Borders:** `1.5px solid var(--line-strong)` — drawn, confident lines are core to the look.
- **Shadow:** hard offset `6px 6px 0 var(--line-strong)` on hover (no blur — riso/print feel).
- **Hover:** cards/buttons lift via `translate(-3px,-3px)` + hard shadow.

## 7. Components (all in `styles.css`)
- `.site-header` — sticky, blurred, bottom hairline; wordmark + nav + theme toggle. **Collapses nav < 640px → build a menu button.**
- `.kicker` — mono uppercase eyebrow.
- `.tag` / `.tag--recipe|--project|--essay` — category pill with leading dot.
- `.btn` / `.btn--accent`, `.arrow-link` — actions; arrow links use the ↗ glyph.
- `.card` + `.grid-3 / .grid-2` — image + tag + title + excerpt; lifts on hover.
- `.featured` — split hero card for the newest Home item.
- `.ph` — **image placeholder.** `data-tone` (sage/beeswax/grenadine/latte) tints it; `data-ph` is the corner caption. **Replace each with a real `<img>` at the same aspect ratio.**
- `.read` — article column: leads, `blockquote` with accent rule, `.dropcap` first letter.
- `.stat-row` / `.ing-list` / `.steps` — recipe: stat strip, checkbox ingredients, numbered method timeline.
- `.proj` — alternating project rows; `.stack` chips + `.status` dot.
- `.site-footer` — 3-col: wordmark + link columns + bottom bar.

## 8. Page anatomy
- **Home** `/` — Hero ("Hi! I'm Matt" eyebrow, title, lead, circular portrait, quick-links + GitHub/LinkedIn) → **Latest** (one featured newest item + 3-up mixed grid across all streams, each card tagged) → About strip.
- **Recipes index** — page head + filter chips → 3-up card grid.
- **Single recipe** — breadcrumb → split hero (intro + square photo) → stat strip (time/yield/effort) → 2-col: sticky ingredients + numbered method + "note" callout.
- **Projects index** — page head → full-width alternating rows: status dot, year, title, summary, stack chips, "case study →".
- **Single project** — breadcrumb → title + actions (GitHub/demo/docs) → wide screenshot → article + sticky spec rail.
- **Blog index** — page head → editorial post rows: date · title + excerpt · read-time; whole row hovers.
- **Single post** — left-aligned header (tag, title, byline) → centered lead figure → 680px reading column w/ dropcap → tag row → "keep reading" 2-up.

## 9. Content model (front-matter)
**Recipe:** `title, slug, date, excerpt, hero, category, time, yield, effort, ingredients[{amount,item}], steps[], note?`
**Project:** `title, slug, date, summary, hero, status, year, stack[], role, metrics?, links{repo,demo,docs}, body`
**Post:** `title, slug, date, readingTime(auto), excerpt, hero, tags[], body`
**Home feed:** all three normalised to `{type, title, date, excerpt, href, tone}`, sorted by `date` desc, top 4–7.

## 10. Theming
- Default Daylight. Twilight = `data-theme="dark"` on `<html>`; tokens remap via `[data-theme="dark"]`.
- Persist in `localStorage["matt-theme"]`. An inline `<head>` snippet applies the saved theme **before paint** (no flash); `theme.js` wires every `[data-theme-toggle]`.
- Optional: default to `prefers-color-scheme` when unset. All transitions disabled under `prefers-reduced-motion`.

## 11. Open items before ship
- **Images:** every `.ph` is a placeholder → real `<img>` at labelled ratios. Supply: portrait (square + 3:4), recipe photos (4:3 / square), project screenshots (16:8), post lead images (16:8).
- **Mobile nav:** hidden < 640px in reference → build a hamburger/drawer.
- **Links:** social + email are `#` placeholders → wire real URLs.
- **Recipe filters** are visual only → make functional (filter by category).
- **Body copy** in the About section and elsewhere is Lorem Ipsum / placeholder → Matt to write.
- **SEO:** per-page meta description + OG image (use the hero); RSS for the blog.
- **A11y:** keep visible focus styles when templatising; contrast pairs are already chosen.
