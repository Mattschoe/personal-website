// Pure localStorage helpers for *this browser's own* recipe vote — kept
// dependency-free (no React) so the load/save logic is unit-testable with a
// mocked storage. The React hook lives in useRecipeRating.ts. Mirrors
// recipe-checklist.ts conventions: a single JSON key, all writes wrapped in
// try/catch (private mode / disabled storage degrade to "nothing persists"
// rather than throwing).
//
// Unlike the checklist, the vote lock is **persistent** (no TTL): once you've
// rated a recipe, this browser stays locked. It's a soft, client-side half of
// the dedup — the server-side ip_hash guard is the other half. Neither is a
// guarantee (no auth), and that's the accepted trade-off.

export const RATINGS_KEY = 'matt-recipe-ratings';

/** `{ [slug]: value }` — the value this browser voted for each recipe. */
export type RatingStore = Record<string, number>;

function isValidVote(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
}

/** Read the store, dropping any malformed entry. `{}` when empty/unavailable. */
export function loadRatings(): RatingStore {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(RATINGS_KEY);
  } catch {
    return {};
  }
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};

  const out: RatingStore = {};
  for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (isValidVote(value)) out[slug] = value;
  }
  return out;
}

export function saveRatings(store: RatingStore): void {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(store));
  } catch {
    // ignore (private mode / storage disabled)
  }
}

/** This browser's own vote for `slug`, or `undefined` if it hasn't voted. */
export function getOwnVote(store: RatingStore, slug: string): number | undefined {
  return slug in store ? store[slug] : undefined;
}

/**
 * Persist this browser's vote for `slug` (re-reading first so we never clobber
 * other recipes' entries) and return the updated store. A no-op if the value
 * is out of range.
 */
export function recordOwnVote(slug: string, value: number): RatingStore {
  if (!isValidVote(value)) return loadRatings();
  const store = loadRatings();
  store[slug] = value;
  saveRatings(store);
  return store;
}
