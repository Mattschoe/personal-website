import matter from 'gray-matter';
import { z } from 'zod';
import {
  recipeFrontmatter,
  projectFrontmatter,
  postFrontmatter,
  type Recipe,
  type Project,
  type Post,
} from './schema';
import {
  slugFromPath,
  readingTime,
  excerptFromBody,
  byDateDesc,
  normalizeIngredients,
} from './derive';

// Build-time content parser. This module imports gray-matter + zod, so it must
// only ever run in Node at build time (it's pulled in by the `virtual:content`
// Vite plugin, never by the client graph). Parsing here — rather than in the
// loader the browser hydrates — keeps the YAML parser out of the shipped bundle.
//
// Each function takes a `{ path: rawFileContents }` map: gray-matter splits the
// front-matter from the body, the zod schema validates it, and the loader's
// derived fields (slug, excerpt, readingTime) are filled in. Invalid front-matter
// throws an error naming the file, which fails the build loudly (CLAUDE.md Rule 4).

type Issue = z.ZodError['issues'][number];

/** Walk a zod issue path into the parsed data to recover the offending value.
 *  Returns undefined for a path that doesn't resolve (i.e. a missing field). */
function valueAtPath(data: unknown, path: ReadonlyArray<PropertyKey>): unknown {
  return path.reduce<unknown>(
    (acc, key) =>
      acc != null && typeof acc === 'object'
        ? (acc as Record<PropertyKey, unknown>)[key]
        : undefined,
    data,
  );
}

/** zod's `expected`/JS type names → plain English the author can act on. */
function readableType(name: string): string {
  switch (name) {
    case 'string':
      return 'text';
    case 'number':
      return 'a number';
    case 'boolean':
      return 'a boolean (true/false)';
    case 'array':
      return 'a list';
    case 'object':
      return 'a set of fields';
    default:
      return name;
  }
}

function actualTypeName(value: unknown): string {
  if (value === null) return 'nothing (an empty value)';
  if (Array.isArray(value)) return 'a list';
  return readableType(typeof value);
}

/** Turn one zod issue into a single, human-readable line naming the field and
 *  what's wrong with it — "required, but missing" beats zod's raw
 *  "Invalid input: expected string, received undefined". */
function describeIssue(issue: Issue, data: unknown): string {
  const field = issue.path.length ? issue.path.join('.') : '(root)';
  // A required field that wasn't supplied resolves to undefined at its path.
  // This is the common case and the one zod reports most cryptically.
  if (issue.path.length && valueAtPath(data, issue.path) === undefined) {
    return `  - ${field}: required, but missing`;
  }
  if (issue.code === 'invalid_type') {
    const got = actualTypeName(valueAtPath(data, issue.path));
    return `  - ${field}: should be ${readableType(issue.expected)}, but got ${got}`;
  }
  if (issue.code === 'unrecognized_keys') {
    const label = issue.keys.length > 1 ? 'unknown fields' : 'unknown field';
    return `  - ${label}: ${issue.keys.join(', ')} (typo, or not a supported field?)`;
  }
  // Anything else (regex, union, min-length…): drop zod's noisy "Invalid input:"
  // prefix and show the field with its message.
  const msg = issue.message.replace(/^Invalid input:?\s*/i, '') || 'invalid value';
  return `  - ${field}: ${msg}`;
}

/** Format zod issues with the offending file path, then throw to fail the build.
 *  When the front-matter parsed to no fields at all, the per-field list is just
 *  noise — every field reads "missing" — so lead with the structural cause
 *  (empty block or, most often, tab indentation, which YAML forbids). */
function fail(path: string, error: z.ZodError, data: unknown): never {
  const details = error.issues.map((i) => describeIssue(i, data)).join('\n');
  const fieldCount =
    data && typeof data === 'object' && !Array.isArray(data)
      ? Object.keys(data).length
      : 0;
  if (fieldCount === 0) {
    throw new Error(
      `Invalid front-matter in ${path}: no fields were found.\n` +
        `The front-matter block is empty or mis-indented — check that each key ` +
        `starts at the left margin and that you indented with spaces, not tabs ` +
        `(YAML forbids tabs for indentation).\n` +
        `Expected, but missing:\n${details}`,
    );
  }
  throw new Error(`Invalid front-matter in ${path}:\n${details}`);
}

interface Parsed {
  path: string;
  data: Record<string, unknown>;
  body: string;
}

/** gray-matter every raw file in a map into { path, data, body }. A malformed
 *  YAML block makes gray-matter throw a js-yaml error that doesn't name the file,
 *  so we catch it and rethrow naming the path — matching `fail()` for zod errors
 *  so a faulty push fails the build with a message that points at the offender. */
function parseAll(modules: Record<string, string>): Parsed[] {
  return Object.entries(modules).map(([path, raw]) => {
    let data: Record<string, unknown>;
    let content: string;
    try {
      ({ data, content } = matter(raw));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // js-yaml reports tab indentation as a generic "bad indentation" — the
      // single most common authoring mistake, so call it out explicitly.
      const hint = /tab|indentation/i.test(msg)
        ? '\n  (Hint: indent with spaces, not tabs — YAML forbids tabs for indentation.)'
        : '';
      throw new Error(`Could not parse front-matter in ${path}:\n  ${msg}${hint}`);
    }
    return { path, data, body: content.trim() };
  });
}

export function parseRecipes(modules: Record<string, string>): Recipe[] {
  return parseAll(modules)
    .map(({ path, data, body }) => {
      const result = recipeFrontmatter.safeParse(data);
      if (!result.success) fail(path, result.error, data);
      const fm = result.data;
      const { flat, groups } = normalizeIngredients(fm.ingredients);
      return {
        ...fm,
        ingredients: flat,
        ingredientGroups: groups,
        slug: fm.slug ?? slugFromPath(path),
        excerpt: fm.excerpt ?? excerptFromBody(body),
        body,
      } satisfies Recipe;
    })
    .sort(byDateDesc((r) => r.slug));
}

export function parseProjects(modules: Record<string, string>): Project[] {
  return parseAll(modules)
    .map(({ path, data, body }) => {
      const result = projectFrontmatter.safeParse(data);
      if (!result.success) fail(path, result.error, data);
      const fm = result.data;
      return {
        ...fm,
        slug: fm.slug ?? slugFromPath(path),
        body,
      } satisfies Project;
    })
    .sort(byDateDesc((p) => p.slug));
}

export function parsePosts(modules: Record<string, string>): Post[] {
  return parseAll(modules)
    .map(({ path, data, body }) => {
      const result = postFrontmatter.safeParse(data);
      if (!result.success) fail(path, result.error, data);
      const fm = result.data;
      return {
        ...fm,
        slug: fm.slug ?? slugFromPath(path),
        excerpt: fm.excerpt ?? excerptFromBody(body),
        readingTime: readingTime(body),
        body,
      } satisfies Post;
    })
    .sort(byDateDesc((p) => p.slug));
}
