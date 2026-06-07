import { describe, it, expect, beforeEach } from 'vitest';
import {
  CHECKLIST_KEY,
  CHECKLIST_TTL_MS,
  loadStore,
  saveStore,
  toggleIndex,
  type ChecklistStore,
} from './recipe-checklist';

beforeEach(() => {
  localStorage.clear();
});

describe('toggleIndex', () => {
  it('adds an absent index and removes a present one', () => {
    expect(toggleIndex([], 2)).toEqual([2]);
    expect(toggleIndex([2], 2)).toEqual([]);
    expect(toggleIndex([1, 3], 2)).toEqual([1, 3, 2]);
  });
});

describe('loadStore', () => {
  const now = 1_000_000_000_000;

  it('returns {} when nothing is stored', () => {
    expect(loadStore(now)).toEqual({});
  });

  it('round-trips a saved store', () => {
    const store: ChecklistStore = {
      soup: { updated: now, ingredients: [0, 2], steps: [1] },
    };
    saveStore(store);
    expect(loadStore(now)).toEqual(store);
  });

  it('drops entries whose last tick is older than the TTL', () => {
    const store: ChecklistStore = {
      fresh: { updated: now - CHECKLIST_TTL_MS, ingredients: [0], steps: [] },
      stale: { updated: now - CHECKLIST_TTL_MS - 1, ingredients: [1], steps: [] },
    };
    saveStore(store);
    const loaded = loadStore(now);
    expect(loaded.fresh).toBeDefined();
    expect(loaded.stale).toBeUndefined();
  });

  it('ignores malformed JSON and malformed entries', () => {
    localStorage.setItem(CHECKLIST_KEY, 'not json');
    expect(loadStore(now)).toEqual({});

    localStorage.setItem(
      CHECKLIST_KEY,
      JSON.stringify({ bad: { updated: 'x', ingredients: 'y' } }),
    );
    expect(loadStore(now)).toEqual({});
  });
});
