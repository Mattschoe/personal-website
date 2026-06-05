import './buffer-shim'; // must run before gray-matter touches `Buffer` (browser)
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

// Build-time content loader. `import.meta.glob` reads every Markdown file in a
// stream folder as a raw string; gray-matter splits front-matter from body; the
// zod schemas validate the front-matter. Invalid front-matter throws an error
// naming the file, which fails the build loudly (CLAUDE.md Rule 4 / PLAN §3).
//
// Eager + raw so the content is baked into the bundle at build time — there is
// no runtime server.

const WORDS_PER_MINUTE = 200;

/** `/content/blog/my-post.md` → `my-post` */
function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

/** Auto reading time from the body: "N min read", at least 1. */
function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/**
 * Fallback excerpt: the first real paragraph of the body, lightly de-marked.
 * Used only when front-matter omits `excerpt` so authoring stays trivial.
 */
function excerptFromBody(body: string): string {
  const para = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 0 && !p.startsWith('#'));
  if (!para) return '';
  return para
    .replace(/\s+/g, ' ')
    .replace(/[*_`>#]/g, '')
    .trim();
}

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

/** gray-matter every raw file in a glob record into { path, data, body }. */
function parseAll(modules: Record<string, string>): Parsed[] {
  return Object.entries(modules).map(([path, raw]) => {
    const { data, content } = matter(raw);
    return { path, data, body: content.trim() };
  });
}

/** Newest first. */
function byDateDesc(a: { date: string }, b: { date: string }): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

const recipeModules = import.meta.glob('/content/recipes/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const projectModules = import.meta.glob('/content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const postModules = import.meta.glob('/content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function loadRecipes(): Recipe[] {
  return parseAll(recipeModules)
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
    .sort(byDateDesc);
}

function loadProjects(): Project[] {
  return parseAll(projectModules)
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
    .sort(byDateDesc);
}

function loadPosts(): Post[] {
  return parseAll(postModules)
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
    .sort(byDateDesc);
}

// Loaded once at module-eval (build time), then served from these frozen arrays.
export const recipes: readonly Recipe[] = Object.freeze(loadRecipes());
export const projects: readonly Project[] = Object.freeze(loadProjects());
export const posts: readonly Post[] = Object.freeze(loadPosts());

// Exposed for tests so the pure helpers can be exercised directly.
export const _internals = {
  slugFromPath,
  readingTime,
  excerptFromBody,
};
