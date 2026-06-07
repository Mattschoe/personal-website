import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readAllContent } from '../content/read.node';
import { mergeFeed } from '../content/feed';
import { buildSitemap, buildRss, buildCombinedFeed } from './feeds';

// Node-only generator wired to vite-react-ssg's `onFinished(outDir)` hook (see
// vite.config.ts). It reads content via the shared Node reader (NOT the
// `virtual:content` module, which doesn't exist outside Vite's graph), builds
// the XML strings, and writes them into the freshly-built `dist/`. Because it
// reads content dynamically, dropping a Markdown file auto-updates the sitemap
// and feeds on the next build with no code change (CLAUDE.md Rule 4).

/** Generate sitemap.xml, rss.xml and feed.xml into `outDir` (the build's dist). */
export function generateSeoArtifacts(outDir: string): void {
  const { recipes, projects, posts } = readAllContent();

  writeFileSync(join(outDir, 'sitemap.xml'), buildSitemap({ recipes, projects, posts }));
  writeFileSync(join(outDir, 'rss.xml'), buildRss(posts));
  writeFileSync(join(outDir, 'feed.xml'), buildCombinedFeed(mergeFeed(recipes, projects, posts)));
}
