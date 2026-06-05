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
import { slugFromPath, readingTime, excerptFromBody, byDateDesc } from './derive';

// Build-time content parser. This module imports gray-matter + zod, so it must
// only ever run in Node at build time (it's pulled in by the `virtual:content`
// Vite plugin, never by the client graph). Parsing here — rather than in the
// loader the browser hydrates — keeps the YAML parser out of the shipped bundle.
//
// Each function takes a `{ path: rawFileContents }` map: gray-matter splits the
// front-matter from the body, the zod schema validates it, and the loader's
// derived fields (slug, excerpt, readingTime) are filled in. Invalid front-matter
// throws an error naming the file, which fails the build loudly (CLAUDE.md Rule 4).

/** Format zod issues with the offending file path, then throw to fail the build. */
function fail(path: string, error: z.ZodError): never {
  const details = error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid front-matter in ${path}:\n${details}`);
}

interface Parsed {
  path: string;
  data: Record<string, unknown>;
  body: string;
}

/** gray-matter every raw file in a map into { path, data, body }. */
function parseAll(modules: Record<string, string>): Parsed[] {
  return Object.entries(modules).map(([path, raw]) => {
    const { data, content } = matter(raw);
    return { path, data, body: content.trim() };
  });
}

export function parseRecipes(modules: Record<string, string>): Recipe[] {
  return parseAll(modules)
    .map(({ path, data, body }) => {
      const result = recipeFrontmatter.safeParse(data);
      if (!result.success) fail(path, result.error);
      const fm = result.data;
      return {
        ...fm,
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
      if (!result.success) fail(path, result.error);
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
      if (!result.success) fail(path, result.error);
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
