// Pure localStorage helpers for *this browser's own* recipe vote — kept
// dependency-free (no React) so the load/save logic is unit-testable with a
// mocked storage. The React hook lives in useRecipeRating.ts. Mirrors
// recipe-checklist.ts conventions: a single JSON key, all writes wrapped in
// try/catch (private mode / disabled storage degrade to "nothing persists"
// rather than throwing).
//
// We remember this browser's own vote per recipe (so it survives reloads) and a
// stable anonymous voter token (getVoterId) that the server dedups on. The
// visitor can re-vote to change their rating: a new submit overwrites the stored
// value here and the server upserts the row keyed on the token. Soft, no-auth
// dedup — clearing storage mints a new token and counts as a new voter, the
// accepted trade-off.

export const RATINGS_KEY = 'matt-recipe-ratings';
export const VOTER_ID_KEY = 'matt-voter-id';

/** `{ [slug]: value }` — the value this browser voted for each recipe. */
export type RatingStore = Record<string, number>;

/**
 * This browser's stable anonymous voter token — the server's dedup key (it can't
 * trust the client IP; see service/ratings/store.mjs). Created once and persisted
 * so the same browser keeps the same identity across visits, which is what lets a
 * visitor *change* their vote (server upserts on it). Clearing storage mints a
 * fresh token and counts as a new voter — the accepted soft-dedup trade-off.
 *
 * Returns a fresh (unpersisted) token when storage is unavailable rather than
 * throwing; the vote still records, it just can't be changed later.
 */
export function getVoterId(): string {
  try {
    const existing = localStorage.getItem(VOTER_ID_KEY);
    if (existing) return existing;
    const id = newVoterId();
    localStorage.setItem(VOTER_ID_KEY, id);
    return id;
  } catch {
    return newVoterId();
  }
}

/** A URL-safe token matching the server's VOTER_ID_RE (UUID, or a fallback). */
function newVoterId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Older browsers without crypto.randomUUID: a 32-char hex string.
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
}

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
