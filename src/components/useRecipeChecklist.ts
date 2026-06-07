import { useCallback, useEffect, useState } from 'react';
import {
  emptyChecks,
  loadStore,
  saveStore,
  toggleIndex,
  type ChecklistKind,
  type RecipeChecks,
} from './recipe-checklist';

// Per-recipe checklist state for ingredients + method steps, persisted to
// localStorage with a rolling 24h TTL (see recipe-checklist.ts).
//
// Hydration safety mirrors ThemeProvider/Recipes: start unchecked so the
// static HTML and first client render agree, then load the persisted (pruned)
// state right after mount. Each tick re-reads the store before writing so we
// never clobber other recipes' state, and refreshes `updated` to now.
export function useRecipeChecklist(slug: string) {
  const [checks, setChecks] = useState<RecipeChecks>(emptyChecks);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const store = loadStore(Date.now());
    saveStore(store); // persist the prune so expired entries don't linger
    if (store[slug]) setChecks(store[slug]);
    setMounted(true);
  }, [slug]);

  const toggle = useCallback(
    (kind: ChecklistKind, index: number) => {
      setChecks((prev) => {
        const next: RecipeChecks = {
          ...prev,
          updated: Date.now(),
          [kind]: toggleIndex(prev[kind], index),
        };
        const store = loadStore(Date.now());
        store[slug] = next;
        saveStore(store);
        return next;
      });
    },
    [slug],
  );

  const isChecked = useCallback(
    (kind: ChecklistKind, index: number) =>
      mounted && checks[kind].includes(index),
    [mounted, checks],
  );

  return { isChecked, toggle };
}
