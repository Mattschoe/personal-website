import { z } from 'zod';

// Zod schemas for the three content streams (SPEC §9). These validate the raw
// front-matter of each Markdown file. They are `strictObject` — any unknown key
// (e.g. a typo'd field) hard-fails the build with a clear message, which keeps
// the "drop a file → it just works" workflow honest.
//
// Fields the loader derives (slug, excerpt, readingTime, body) are optional or
// absent here; the loader guarantees them on the final item types below.

// YAML auto-parses an unquoted `2024-07-04` into a JS Date, so accept either and
// normalise to a `YYYY-MM-DD` string. Authors shouldn't have to remember to quote.
const isoDate = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)'),
);

// A text field that may arrive as a YAML number (e.g. `year: 2025`,
// `amount: 1`). Coerce to a non-empty string; a missing field still fails the
// union, so required-field checks keep working.
const text = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .pipe(z.string().min(1));

// Shared front-matter every stream carries.
const base = {
  title: z.string().min(1),
  date: isoDate,
  slug: z.string().min(1).optional(),
  // Image path (absolute `/images/...` URL under `public/`) + its alt text.
  // Both optional: when `hero` is unset the UI shows a toned `.ph` placeholder.
  hero: z.string().min(1).optional(),
  heroAlt: z.string().min(1).optional(),
  // Marks seed/sample content so it's easy to find and delete. Allowed on every
  // stream so the strict schemas don't reject our development fixtures.
  sample: z.boolean().optional(),
};

export const recipeFrontmatter = z.strictObject({
  ...base,
  excerpt: z.string().min(1).optional(),
  category: z.string().min(1),
  time: z.string().min(1),
  yield: z.string().min(1),
  effort: z.string().min(1),
  ingredients: z
    .array(z.strictObject({ amount: text, item: z.string().min(1) }))
    .min(1),
  steps: z.array(z.string().min(1)).min(1),
  note: z.string().min(1).optional(),
});

export const projectFrontmatter = z.strictObject({
  ...base,
  summary: z.string().min(1),
  status: z.string().min(1),
  year: text,
  stack: z.array(z.string().min(1)).min(1),
  role: z.string().min(1),
  metrics: z.string().min(1).optional(),
  links: z
    .strictObject({
      repo: z.string().min(1).optional(),
      demo: z.string().min(1).optional(),
      docs: z.string().min(1).optional(),
    })
    .optional(),
});

export const postFrontmatter = z.strictObject({
  ...base,
  excerpt: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).min(1),
});

export type RecipeFrontmatter = z.infer<typeof recipeFrontmatter>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatter>;
export type PostFrontmatter = z.infer<typeof postFrontmatter>;

// Final, loaded item types: front-matter + the loader's derived fields. `slug`,
// `excerpt` and `body` are always present after loading; posts also get an
// auto-derived `readingTime`.
export type Recipe = RecipeFrontmatter & {
  slug: string;
  excerpt: string;
  body: string;
};

export type Project = ProjectFrontmatter & {
  slug: string;
  body: string;
};

export type Post = PostFrontmatter & {
  slug: string;
  excerpt: string;
  readingTime: string;
  body: string;
};

// One item from any stream, normalised for the Home "Latest" feed (SPEC §9).
export type FeedType = 'recipe' | 'project' | 'essay';
export type FeedTone = 'grenadine' | 'sage' | 'beeswax';

export interface FeedItem {
  type: FeedType;
  title: string;
  date: string;
  excerpt: string;
  href: string;
  tone: FeedTone;
  // Carried through from the source item so Home's featured + feed cards can
  // show a real image; absent → the card keeps its toned placeholder.
  hero?: string;
  heroAlt?: string;
}
