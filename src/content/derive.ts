// Pure, dependency-free helpers shared by the build-time parser (`parse.ts`) and
// the client-safe query layer (`index.ts`). Nothing here imports gray-matter or
// touches the filesystem, so it's safe in both the Node build and the browser.

const WORDS_PER_MINUTE = 200;

/** `/content/blog/my-post.md` → `my-post` */
export function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

/** Auto reading time from the body: "N min read", at least 1. */
export function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/**
 * Fallback excerpt: the first real paragraph of the body, lightly de-marked.
 * Used only when front-matter omits `excerpt` so authoring stays trivial.
 * Strips images, unwraps `[text](url)` links to their text, then drops the
 * remaining inline markers so the excerpt reads as plain prose.
 */
export function excerptFromBody(body: string): string {
  const para = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 0 && !p.startsWith('#'));
  if (!para) return '';
  return para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images → gone
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → their text
    .replace(/\s+/g, ' ')
    .replace(/[*_`>#]/g, '')
    .trim();
}

/**
 * Newest-first comparator. Ties on `date` are broken by a stable secondary key
 * (ascending) so the merged/sorted output is deterministic regardless of the
 * order the files happen to be read in.
 */
export function byDateDesc<T extends { date: string }>(
  secondaryKey: (item: T) => string,
): (a: T, b: T) => number {
  return (a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const ka = secondaryKey(a);
    const kb = secondaryKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  };
}
