import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { readAllContent } from './read.node';
import { imageRefsFromBody } from './derive';

// Content-image integrity guard.
//
// This is a DELIBERATE, NARROW exception to the project rule that tests are
// decoupled from `content/` and run against fixtures (CLAUDE.md → Workflow).
// That rule keeps *logic* tests stable regardless of author content; this test
// is not a logic test — its entire job is to validate the ACTUAL author content
// against the ACTUAL asset files under `public/`. So it reads the real content
// tree via read.node.ts (independent of the `virtual:content → fixtures` alias
// in vite.config.ts) and checks the real filesystem. Do not "fix" it back to
// fixtures.
//
// Why it exists: every image referenced by a content file — via `hero:`
// front-matter or an inline Markdown `![alt](/images/...)` — must ship a real
// file at that exact path AND extension. Converting heroes from .jpg to .webp
// once left the whole site image-less because the front-matter still pointed at
// the gone .jpg files and nothing in CI noticed. This test fails the build for
// any broken reference, naming the offending item and path.

const PUBLIC_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'public',
);

interface Ref {
  /** Human-readable origin, e.g. `recipe "krebinetter-mushroom-sauce" (hero)`. */
  label: string;
  /** The absolute `/images/...` path as referenced. */
  path: string;
}

/** Every local image referenced across all three streams (hero + inline body). */
function collectRefs(): Ref[] {
  const { recipes, projects, posts } = readAllContent();
  const refs: Ref[] = [];
  const streams: Array<[string, Array<{ slug: string; hero?: string; body: string }>]> = [
    ['recipe', recipes],
    ['project', projects],
    ['post', posts],
  ];
  for (const [type, items] of streams) {
    for (const item of items) {
      if (item.hero && item.hero.startsWith('/')) {
        refs.push({ label: `${type} "${item.slug}" (hero)`, path: item.hero });
      }
      for (const path of imageRefsFromBody(item.body)) {
        refs.push({ label: `${type} "${item.slug}" (inline image)`, path });
      }
    }
  }
  return refs;
}

const refs = collectRefs();

describe('content image references', () => {
  // A safety net for the safety net: if a future refactor stops collecting
  // references, every per-ref assertion would vacuously pass. Assert we found
  // at least the heroes we know exist.
  it('finds image references to check', () => {
    expect(refs.length).toBeGreaterThan(0);
  });

  it.each(refs)('$label → $path exists under public/', ({ path }) => {
    expect(existsSync(join(PUBLIC_ROOT, path))).toBe(true);
  });
});
