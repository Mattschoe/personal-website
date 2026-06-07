import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { readAllContent } from './src/content/read.node';

// Build-time content plugin. It reads every Markdown file under `content/`,
// parses + validates it once in Node (via src/content/read.node.ts → parse.ts),
// and exposes the result as the virtual module `virtual:content`. The browser
// then imports already-parsed data instead of re-running gray-matter/js-yaml at
// hydration — keeping the YAML parser (~150KB) out of the client bundle.
//
// The actual file reading/parsing lives in src/content/read.node.ts so the SEO
// generator (sitemap/RSS) shares it. Invalid front-matter throws during load,
// which fails the build loudly and names the offending file (CLAUDE.md Rule 4).

const VIRTUAL_ID = 'virtual:content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), 'content');

function buildModule(): string {
  const { recipes, projects, posts } = readAllContent();
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
