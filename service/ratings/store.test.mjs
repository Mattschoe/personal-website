import { describe, it, expect, beforeEach } from 'vitest';
import {
  openDb,
  recordVote,
  aggregate,
  aggregateAll,
  ipHash,
  validateSlug,
  validateValue,
  ValidationError,
} from './store.mjs';

let db;
beforeEach(() => {
  // Fresh in-memory DB per test — no files, no shared state.
  db = openDb(':memory:');
});

describe('recordVote + aggregate', () => {
  it('returns count 0 / average 0 for an unrated slug', () => {
    expect(aggregate(db, 'soup')).toEqual({ count: 0, average: 0 });
  });

  it('records a vote and reflects it in the aggregate', () => {
    expect(recordVote(db, 'soup', 4, 'hashA')).toEqual({ count: 1, average: 4 });
    expect(aggregate(db, 'soup')).toEqual({ count: 1, average: 4 });
  });

  it('averages distinct voters and rounds to one decimal', () => {
    recordVote(db, 'soup', 5, 'hashA');
    recordVote(db, 'soup', 4, 'hashB');
    recordVote(db, 'soup', 4, 'hashC');
    // (5+4+4)/3 = 4.333… → 4.3
    expect(aggregate(db, 'soup')).toEqual({ count: 3, average: 4.3 });
  });

  it('ignores a repeat vote from the same ip_hash on the same slug', () => {
    recordVote(db, 'soup', 5, 'hashA');
    const after = recordVote(db, 'soup', 1, 'hashA'); // same voter, should be dropped
    expect(after).toEqual({ count: 1, average: 5 });
  });

  it('lets the same ip_hash vote on a different slug', () => {
    recordVote(db, 'soup', 5, 'hashA');
    recordVote(db, 'stew', 3, 'hashA');
    expect(aggregate(db, 'soup')).toEqual({ count: 1, average: 5 });
    expect(aggregate(db, 'stew')).toEqual({ count: 1, average: 3 });
  });
});

describe('aggregateAll', () => {
  it('groups every rated slug in one pass', () => {
    recordVote(db, 'soup', 5, 'hashA');
    recordVote(db, 'soup', 3, 'hashB');
    recordVote(db, 'stew', 2, 'hashC');
    expect(aggregateAll(db)).toEqual({
      soup: { count: 2, average: 4 },
      stew: { count: 1, average: 2 },
    });
  });

  it('is empty before any votes', () => {
    expect(aggregateAll(db)).toEqual({});
  });
});

describe('validation', () => {
  it('rejects out-of-range and non-integer values', () => {
    for (const bad of [0, 6, -1, 3.5, '4', null, undefined, NaN]) {
      expect(() => recordVote(db, 'soup', bad, 'hashA')).toThrow(ValidationError);
    }
  });

  it('accepts each value 1..5', () => {
    for (const v of [1, 2, 3, 4, 5]) expect(validateValue(v)).toBe(v);
  });

  it('rejects malformed slugs', () => {
    for (const bad of ['', 'Soup', 'soup!', 'a b', '../etc', 5]) {
      expect(() => validateSlug(bad)).toThrow(ValidationError);
    }
  });

  it('accepts a well-formed slug', () => {
    expect(validateSlug('teriyaki-skewers-2')).toBe('teriyaki-skewers-2');
  });
});

describe('ipHash', () => {
  it('is deterministic for the same ip + salt', () => {
    expect(ipHash('1.2.3.4', 'pepper')).toBe(ipHash('1.2.3.4', 'pepper'));
  });

  it('changes with the salt (so hashes are not portable across deploys)', () => {
    expect(ipHash('1.2.3.4', 'pepper')).not.toBe(ipHash('1.2.3.4', 'other'));
  });

  it('never returns the raw IP', () => {
    expect(ipHash('1.2.3.4', 'pepper')).not.toContain('1.2.3.4');
  });
});
