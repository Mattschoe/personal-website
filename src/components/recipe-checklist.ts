// Pure localStorage helpers for the recipe ingredient/step checklists, kept
// dependency-free (no React) so the load/prune/toggle logic is unit-testable
// with a mocked clock and storage. The React hook lives in
// useRecipeChecklist.ts. Storage mirrors the ThemeProvider conventions: a
// single JSON key, all writes wrapped in try/catch (private mode / disabled
// storage degrade to "nothing persists" rather than throwing).

export const CHECKLIST_KEY = 'matt-recipe-checks';

// Checked state auto-clears 24h after the last tick — long enough to survive a
// phone reload mid-cook, short enough that yesterday's recipe starts fresh.
export const CHECKLIST_TTL_MS = 24 * 60 * 60 * 1000;

export type ChecklistKind = 'ingredients' | 'steps';

export interface RecipeChecks {
  /** Epoch ms of the last tick — drives the rolling TTL. */
  updated: number;
  /** Checked indices over the flattened ingredient list. */
  ingredients: number[];
  /** Checked indices over the method steps. */
  steps: number[];
}

export type ChecklistStore = Record<string, RecipeChecks>;

export function emptyChecks(): RecipeChecks {
  return { updated: 0, ingredients: [], steps: [] };
}

function isIndexList(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((n) => typeof n === 'number');
}

function isChecks(v: unknown): v is RecipeChecks {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.updated === 'number' &&
    isIndexList(e.ingredients) &&
    isIndexList(e.steps)
  );
}

/**
 * Read the store, dropping any malformed or expired entry (a recipe whose last
 * tick is more than the TTL before `now`). Returns `{}` when storage is
 * empty/unavailable or the payload is unusable.
 */
export function loadStore(now: number): ChecklistStore {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CHECKLIST_KEY);
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

  const out: ChecklistStore = {};
  for (const [slug, entry] of Object.entries(parsed as Record<string, unknown>)) {
    if (isChecks(entry) && now - entry.updated <= CHECKLIST_TTL_MS) {
      out[slug] = entry;
    }
  }
  return out;
}

export function saveStore(store: ChecklistStore): void {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(store));
  } catch {
    // ignore (private mode / storage disabled)
  }
}

/** Add `index` if absent, remove it if present. */
export function toggleIndex(list: number[], index: number): number[] {
  return list.includes(index)
    ? list.filter((i) => i !== index)
    : [...list, index];
}
