import { describe, it, expect } from 'vitest';
import { getRatings, getRating, starFill } from './ratings';

describe('getRatings', () => {
  it('returns the snapshot with a ratings map and a generatedAt', () => {
    const snap = getRatings();
    expect(typeof snap.generatedAt).toBe('string');
    expect(snap.ratings).toBeTypeOf('object');
  });
});

describe('getRating', () => {
  it('returns undefined for an unknown slug', () => {
    expect(getRating('does-not-exist-xyz')).toBeUndefined();
  });
});

describe('starFill', () => {
  it('fully fills whole stars and partially fills the fractional one', () => {
    // 4.3 → four full stars (indices 0–3) plus 30% of the fifth (index 4).
    expect(starFill(4.3, 0)).toBe(1);
    expect(starFill(4.3, 3)).toBe(1);
    expect(starFill(4.3, 4)).toBeCloseTo(0.3, 5);
  });

  it('leaves stars beyond the average empty', () => {
    expect(starFill(4.3, 5)).toBe(0);
    expect(starFill(2, 3)).toBe(0);
    expect(starFill(2, 2)).toBe(0);
  });

  it('clamps an out-of-range average to [0, 1] per star', () => {
    expect(starFill(7, 0)).toBe(1);
    expect(starFill(-1, 0)).toBe(0);
  });
});
