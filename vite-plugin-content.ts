import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { parseRecipes, parseProjects, parsePosts } from './src/content/parse';

// Build-time content plugin. It reads every Markdown file under `content/`,
// parses + validates it once in Node (via src/content/parse.ts), and exposes the
// result as the virtual module `virtual:content`. The browser then imports
// already-parsed data instead of re-running gray-matter/js-yaml at hydration —
// keeping the YAML parser (~150KB) out of the client bundle.
//
// Invalid front-matter throws during load, which fails the build loudly and
// names the offending file (CLAUDE.md Rule 4).

const VIRTUAL_ID = 'virtual:content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), 'content');

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

function buildModule(): string {
  const recipes = parseRecipes(readStream('recipes'));
  const projects = parseProjects(readStream('projects'));
  const posts = parsePosts(readStream('blog')); // the blog stream lives in content/blog/
  return [
    `export const recipes = ${JSON.stringify(recipes)};`,
    `export const projects = ${JSON.stringify(projects)};`,
    `export const posts = ${JSON.stringify(posts)};`,
  ].join('\n');
}

export function contentPlugin(): Plugin {
  return {
    name: 'matt-content',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) return buildModule();
    },
    configureServer(server) {
      // Reparse + full-reload when any content file changes in dev.
      server.watcher.add(CONTENT_ROOT);
      const onChange = (file: string) => {
        if (!file.startsWith(CONTENT_ROOT) || !file.endsWith('.md')) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
