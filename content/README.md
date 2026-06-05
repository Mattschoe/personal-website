# Adding content

Every page on the site is generated from the Markdown files in this folder. To publish, **drop a
`.md` file into the right stream folder, commit, and push to `main`** — the next deploy prerenders it
into a real, crawlable page. No code changes, no route edits, no index to update.

```
content/
  recipes/*.md     one file per recipe
  projects/*.md    one file per project / case study
  blog/*.md        one file per post
  assets/          images referenced by content (Phase 8)
```

Each file is YAML front-matter (between `---` lines) followed by a Markdown **body**. Front-matter is
validated at build time: an unknown or malformed field **fails the build** with a message naming the
file, so typos can't slip through silently.

## Conventions for every stream

- **`slug`** is optional — it defaults to the filename (`weeknight-tomato-soup.md` → `/recipes/weeknight-tomato-soup`). Set it explicitly only to override.
- **`date`** must be `YYYY-MM-DD`. Streams sort newest-first, and the Home "Latest" feed merges all three by date.
- **`hero`** (optional) is an image path; real images arrive in Phase 8, so it's safe to omit for now.
- **`sample: true`** marks development seed content. Delete those files when real content lands.

## Recipes (`content/recipes/`)

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | `YYYY-MM-DD` |
| `category` | yes | e.g. `Baking`, `Salads` |
| `time` | yes | e.g. `35 min` |
| `yield` | yes | e.g. `Serves 4` |
| `effort` | yes | e.g. `Easy` |
| `ingredients` | yes | list of `{ amount, item }` |
| `steps` | yes | list of strings (the method) |
| `excerpt` | no | one-line summary; derived from the body if omitted |
| `note` | no | a closing tip/callout |
| `slug`, `hero`, `sample` | no | see conventions above |

The body is the recipe's intro prose.

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
| `slug`, `hero`, `sample` | no | see conventions above |

The body is the case-study article.

## Blog (`content/blog/`)

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | `YYYY-MM-DD` |
| `tags` | yes | list of strings |
| `excerpt` | no | one-line summary; derived from the body if omitted |
| `slug`, `hero`, `sample` | no | see conventions above |

Reading time is **computed automatically** from the body — don't set it. The body is the post
article.
