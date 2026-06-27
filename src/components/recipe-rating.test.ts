import { describe, it, expect, beforeEach } from 'vitest';
import {
  RATINGS_KEY,
  VOTER_ID_KEY,
  loadRatings,
  saveRatings,
  getOwnVote,
  recordOwnVote,
  getVoterId,
  type RatingStore,
} from './recipe-rating';

beforeEach(() => {
  localStorage.clear();
});

describe('loadRatings / saveRatings', () => {
  it('returns {} when nothing is stored', () => {
    expect(loadRatings()).toEqual({});
  });

  it('round-trips a saved store', () => {
    const store: RatingStore = { soup: 5, stew: 3 };
    saveRatings(store);
    expect(loadRatings()).toEqual(store);
  });

  it('ignores malformed JSON and out-of-range entries', () => {
    localStorage.setItem(RATINGS_KEY, 'not json');
    expect(loadRatings()).toEqual({});

    localStorage.setItem(
      RATINGS_KEY,
      JSON.stringify({ ok: 4, bad: 9, frac: 2.5, str: '3' }),
    );
    expect(loadRatings()).toEqual({ ok: 4 });
  });
});

describe('getOwnVote', () => {
  it('reads a present vote and returns undefined otherwise', () => {
    expect(getOwnVote({ soup: 4 }, 'soup')).toBe(4);
    expect(getOwnVote({ soup: 4 }, 'stew')).toBeUndefined();
  });
});

describe('recordOwnVote', () => {
  it('persists a vote without clobbering other recipes', () => {
    saveRatings({ stew: 3 });
    const next = recordOwnVote('soup', 5);
    expect(next).toEqual({ stew: 3, soup: 5 });
    expect(loadRatings()).toEqual({ stew: 3, soup: 5 });
  });

  it('is a no-op for an out-of-range value', () => {
    saveRatings({ stew: 3 });
    expect(recordOwnVote('soup', 9)).toEqual({ stew: 3 });
    expect(loadRatings()).toEqual({ stew: 3 });
  });
});

describe('getVoterId', () => {
  it('mints a token on first call and reuses it thereafter', () => {
    const first = getVoterId();
    expect(first).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(localStorage.getItem(VOTER_ID_KEY)).toBe(first);
    expect(getVoterId()).toBe(first); // stable across calls
  });

  it('honours an already-stored token', () => {
    const existing = '11111111-1111-4111-8111-111111111111';
    localStorage.setItem(VOTER_ID_KEY, existing);
    expect(getVoterId()).toBe(existing);
  });
});
