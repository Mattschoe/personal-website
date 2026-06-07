import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRecipes, parseProjects, parsePosts } from './parse';
import type { Recipe, Project, Post } from './schema';

// Node-only content reader: walks `content/`, parses + zod-validates every
// Markdown file (via parse.ts) into the typed item arrays. This is the shared
// file-reader used by BOTH the `virtual:content` Vite plugin (which serialises
// the result into the browser bundle) and the build-time SEO generator (which
// can't import the `virtual:content` module from a plain Node hook). Keeping the
// reader in one place means the sitemap/RSS see exactly what the site renders.
//
// Imports gray-matter (via parse.ts) and the filesystem, so it must only ever
// run in Node — never in the client graph.

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content');

/** Read every `*.md` file in a stream folder into a `{ /content/<stream>/<file>: raw }` map. */
function readStream(stream: string): Record<string, string> {
  const dir = join(CONTENT_ROOT, stream);
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  } catch {
    return {}; // folder may not exist yet — an empty stream is valid
  }
  return Object.fromEntries(
    files.map((f) => [`/content/${stream}/${f}`, readFileSync(join(dir, f), 'utf8')]),
  );
}

export interface AllContent {
  recipes: Recipe[];
  projects: Project[];
  posts: Post[];
}

/** Read, parse and validate every content stream. Throws (naming the file) on
 *  invalid front-matter, failing the build loudly (CLAUDE.md Rule 4). */
export function readAllContent(): AllContent {
  return {
    recipes: parseRecipes(readStream('recipes')),
    projects: parseProjects(readStream('projects')),
    posts: parsePosts(readStream('blog')), // the blog stream lives in content/blog/
  };
}
