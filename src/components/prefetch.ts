// URLs already requested this session — so hovering many cards (or the same
// card repeatedly) never re-triggers a fetch. Module-level so it's shared
// across every PrefetchLink instance.
const requested = new Set<string>();

/**
 * Warm the browser cache for an image so a later real `<img src=url>` is a cache
 * hit instead of a visible placeholder→photo pop-in. Fire-and-forget: we create
 * a detached `Image`, set its src to kick off a normal-priority fetch, and let
 * the HTTP cache do the rest. Deduped per session and a no-op when there's
 * nothing to fetch, when the platform can't (SSG prerender), or when the user
 * has asked to save data.
 */
export function prefetchImage(url?: string): void {
  if (!url || requested.has(url)) return;
  // Guard prerender (vite-react-ssg runs this in Node, where `Image`/`window`
  // don't exist) and respect data-saver mode.
  if (typeof window === 'undefined' || typeof Image === 'undefined') return;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;

  requested.add(url);
  const img = new Image();
  img.src = url;
}
