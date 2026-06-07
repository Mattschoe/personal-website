# Adding content

Every page on the site is generated from the Markdown files in this folder. To publish, **drop a
`.md` file into the right stream folder, commit, and push to `main`** — the next deploy prerenders it
into a real, crawlable page. No code changes, no route edits, no index to update.

```
content/
  recipes/*.md     one file per recipe
  projects/*.md    one file per project / case study
  blog/*.md        one file per post
```

## Images

Images live under **`public/images/...`** and are referenced from front-matter by their absolute URL
path. To add one: drop the file in (e.g.) `public/images/recipes/`, then set `hero:` on the item —
no code change needed.

```yaml
hero: /images/recipes/charred-corn-salad.jpg
heroAlt: A platter of blistered sweetcorn with herbs and lime   # optional
```

- **`hero`** is the image; when omitted the page shows a tasteful toned placeholder, so it's always
  safe to leave off until you have a photo.
- **`heroAlt`** is the alt text; if omitted it falls back to the item's `title`. Use `''`-style intent
  only for purely decorative imagery (the portraits on Home use empty alt).
- Use the labelled aspect ratios from the design (portrait square/3:4, recipe 4:3/square, project
  16:8, post lead 16:8) — the box is fixed, so an off-ratio image is cropped to `cover`.

Each file is YAML front-matter (between `---` lines) followed by a Markdown **body**. Front-matter is
validated at build time: an unknown or malformed field **fails the build** with a message naming the
file, so typos can't slip through silently.

## Conventions for every stream

- **`slug`** is optional — it defaults to the filename (`weeknight-tomato-soup.md` → `/recipes/weeknight-tomato-soup`). Set it explicitly only to override.
- **`date`** must be `YYYY-MM-DD`. Streams sort newest-first, and the Home "Latest" feed merges all three by date.
- **`hero`** / **`heroAlt`** (optional) point at an image under `public/images/` — see **Images** above.
- **`sample: true`** marks development seed content. Delete those files when real content lands.

## Recipes (`content/recipes/`)

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | `YYYY-MM-DD` |
| `category` | yes | e.g. `Baking`, `Salads` |
| `time` | yes | e.g. `35 min` |
| `yield` | yes | e.g. `Serves 4` |
| `ingredients` | yes | list of `{ amount, item }`, or a list of headed groups (see below) |
| `steps` | yes | list of strings (the method) |
| `excerpt` | no | one-line summary; derived from the body if omitted |
| `note` | no | a closing tip/callout |
| `pairsWith` | no | list of other recipe slugs to surface under "Goes well with" |
| `slug`, `hero`, `heroAlt`, `sample` | no | see conventions above |

The body is the recipe's intro prose.

`pairsWith` lists the **slugs** of other recipes (a recipe's slug is its
filename without `.md`, unless overridden by a `slug` field). Each must resolve
to a real recipe — a typo or a recipe pairing with itself fails the build:

```yaml
pairsWith:
  - charred-corn-salad
  - weeknight-tomato-soup
```

`ingredients` can be a flat list:

```yaml
ingredients:
  - amount: 600 g
    item: chicken thigh
  - amount: 100 g
    item: soy sauce
```

…or split into headed groups (e.g. a marinade and the skewers). Use one form or
the other — don't mix flat items and groups in the same list:

```yaml
ingredients:
  - heading: Marinade
    items:
      - amount: 100 g
        item: soy sauce
  - heading: Skewers
    items:
      - amount: 600 g
        item: chicken thigh
```

## Projects (`content/projects/`)

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | `YYYY-MM-DD` |
| `summary` | yes | one-line description (used on cards and the feed) |
| `status` | yes | e.g. `Active · v1.2 · MIT` |
| `year` | yes | e.g. `2023 — present` |
| `role` | yes | e.g. `Design, code, docs — solo` |
| `stack` | yes | list of strings (tech chips) |
| `metrics` | no | e.g. `2.1k stars · 40k installs` |
| `links` | no | object with optional `repo`, `demo`, `docs` URLs |
| `slug`, `hero`, `heroAlt`, `sample` | no | see conventions above |

The body is the case-study article.

## Blog (`content/blog/`)

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | `YYYY-MM-DD` |
| `tags` | yes | list of strings |
| `excerpt` | no | one-line summary; derived from the body if omitted |
| `slug`, `hero`, `heroAlt`, `sample` | no | see conventions above |

Reading time is **computed automatically** from the body — don't set it. The body is the post
article.
