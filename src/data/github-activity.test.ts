import { describe, it, expect } from 'vitest';
import { flattenDays, levelThresholds, cellLevel, type GithubActivity } from './github-activity';

const calendar: GithubActivity['calendar'] = {
  totalContributions: 30,
  weeks: [
    { days: [{ date: '2025-06-15', count: 0 }, { date: '2025-06-16', count: 1 }] },
    { days: [{ date: '2025-06-22', count: 5 }, { date: '2025-06-23', count: 20 }] },
  ],
};

describe('flattenDays', () => {
  it('flattens weeks into a single column-ordered list', () => {
    const days = flattenDays(calendar);
    expect(days).toHaveLength(4);
    expect(days.map((d) => d.count)).toEqual([0, 1, 5, 20]);
  });
});

describe('levelThresholds', () => {
  it('derives quartile boundaries from nonzero counts', () => {
    // nonzero sorted: [1, 5, 20] → p25/p50/p75 indices 0,1,2
    expect(levelThresholds(flattenDays(calendar))).toEqual([1, 5, 20]);
  });

  it('returns a safe default when there is no activity', () => {
    expect(levelThresholds([{ date: '2025-01-01', count: 0 }])).toEqual([1, 1, 1]);
  });
});

describe('cellLevel', () => {
  const t: [number, number, number] = [2, 5, 10];

  it('maps zero (or less) to level 0', () => {
    expect(cellLevel(0, t)).toBe(0);
    expect(cellLevel(-3, t)).toBe(0);
  });

  it('steps up through the thresholds', () => {
    expect(cellLevel(1, t)).toBe(1);
    expect(cellLevel(2, t)).toBe(1);
    expect(cellLevel(3, t)).toBe(2);
    expect(cellLevel(5, t)).toBe(2);
    expect(cellLevel(8, t)).toBe(3);
    expect(cellLevel(10, t)).toBe(3);
    expect(cellLevel(11, t)).toBe(4);
    expect(cellLevel(99, t)).toBe(4);
  });
});
