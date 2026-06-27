import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import {
  openDb,
  recordVote,
  aggregate,
  aggregateAll,
  ipHash,
  validateSlug,
  validateValue,
  validateVoterId,
  ValidationError,
} from './store.mjs';

// Two well-formed voter tokens (match VOTER_ID_RE); a third for variety.
const VOTER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VOTER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const VOTER_C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

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
    expect(recordVote(db, 'soup', 4, VOTER_A)).toEqual({ count: 1, average: 4 });
    expect(aggregate(db, 'soup')).toEqual({ count: 1, average: 4 });
  });

  it('averages distinct voters and rounds to one decimal', () => {
    recordVote(db, 'soup', 5, VOTER_A);
    recordVote(db, 'soup', 4, VOTER_B);
    recordVote(db, 'soup', 4, VOTER_C);
    // (5+4+4)/3 = 4.333… → 4.3
    expect(aggregate(db, 'soup')).toEqual({ count: 3, average: 4.3 });
  });

  it('updates the value on a repeat vote from the same voter_id (change your rating)', () => {
    recordVote(db, 'soup', 5, VOTER_A);
    const after = recordVote(db, 'soup', 1, VOTER_A); // same voter, overwrites
    expect(after).toEqual({ count: 1, average: 1 });
  });

  it('preserves created_at across a re-vote (it stays the first-vote time)', () => {
    recordVote(db, 'soup', 5, VOTER_A, 'firstHash');
    const first = db.prepare('SELECT created_at FROM votes WHERE slug = ?').get('soup').created_at;
    // Re-vote with a different value + ip_hash; created_at must not move.
    recordVote(db, 'soup', 2, VOTER_A, 'laterHash');
    const row = db.prepare('SELECT created_at, value, ip_hash FROM votes WHERE slug = ?').get('soup');
    expect(row.created_at).toBe(first);
    expect(row.value).toBe(2); // value still updates
    expect(row.ip_hash).toBe('laterHash'); // ip_hash still updates
  });

  it('counts distinct voter_ids on the same slug even from one ip_hash (the #2 fix)', () => {
    // Under rootless Podman every visitor shares one ip_hash; dedup must key on
    // the voter token, so two different tokens are two votes.
    recordVote(db, 'soup', 5, VOTER_A, 'sameIpHash');
    recordVote(db, 'soup', 4, VOTER_B, 'sameIpHash');
    expect(aggregate(db, 'soup')).toEqual({ count: 2, average: 4.5 });
  });

  it('lets the same voter vote on a different slug', () => {
    recordVote(db, 'soup', 5, VOTER_A);
    recordVote(db, 'stew', 3, VOTER_A);
    expect(aggregate(db, 'soup')).toEqual({ count: 1, average: 5 });
    expect(aggregate(db, 'stew')).toEqual({ count: 1, average: 3 });
  });
});

describe('aggregateAll', () => {
  it('groups every rated slug in one pass', () => {
    recordVote(db, 'soup', 5, VOTER_A);
    recordVote(db, 'soup', 3, VOTER_B);
    recordVote(db, 'stew', 2, VOTER_C);
    expect(aggregateAll(db)).toEqual({
      soup: { count: 2, average: 4 },
      stew: { count: 1, average: 2 },
    });
  });

  it('is empty before any votes', () => {
    expect(aggregateAll(db)).toEqual({});
  });
});

describe('migration from the legacy ip_hash schema', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ratings-migrate-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('rebuilds onto voter_id via openDb, preserving historical rows', () => {
    const path = join(dir, 'votes.db');

    // Seed a file with the old schema (UNIQUE(slug, ip_hash), no voter_id).
    const legacy = new Database(path);
    legacy.exec(`
      CREATE TABLE votes (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        slug       TEXT    NOT NULL,
        ip_hash    TEXT    NOT NULL,
        value      INTEGER NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        UNIQUE(slug, ip_hash)
      );
    `);
    legacy.prepare('INSERT INTO votes (slug, ip_hash, value) VALUES (?, ?, ?)').run('soup', 'oldhash', 5);
    legacy.prepare('INSERT INTO votes (slug, ip_hash, value) VALUES (?, ?, ?)').run('stew', 'oldhash', 4);
    legacy.close();

    // Reopen through the production path → migrate() runs.
    const migrated = openDb(path);
    const cols = migrated.prepare('PRAGMA table_info(votes)').all().map((c) => c.name);
    expect(cols).toContain('voter_id');
    expect(aggregate(migrated, 'soup')).toEqual({ count: 1, average: 5 });
    expect(aggregate(migrated, 'stew')).toEqual({ count: 1, average: 4 });

    // And the new dedup key works on the migrated table.
    recordVote(migrated, 'soup', 1, VOTER_A);
    expect(aggregate(migrated, 'soup')).toEqual({ count: 2, average: 3 });
    migrated.close();
  });
});

describe('validation', () => {
  it('rejects out-of-range and non-integer values', () => {
    for (const bad of [0, 6, -1, 3.5, '4', null, undefined, NaN]) {
      expect(() => recordVote(db, 'soup', bad, VOTER_A)).toThrow(ValidationError);
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

  it('rejects malformed voter ids', () => {
    for (const bad of ['', 'short', 'has spaces here ok', 'bad!char#token', 'x'.repeat(65), 42, null]) {
      expect(() => validateVoterId(bad)).toThrow(ValidationError);
    }
  });

  it('accepts a UUID-shaped voter id', () => {
    expect(validateVoterId(VOTER_A)).toBe(VOTER_A);
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
