import { describe, it, expect } from 'vitest';
import {
  formatDate,
  slugFromPath,
  readingTime,
  excerptFromBody,
  truncate,
  byDateDesc,
} from './derive';

describe('formatDate', () => {
  it('formats without a year by default', () => {
    expect(formatDate('2026-05-28')).toBe('May 28');
  });

  it('formats with a year when asked', () => {
    expect(formatDate('2026-06-01', { withYear: true })).toBe('Jun 1, 2026');
  });

  it('drops the leading zero from single-digit days', () => {
    expect(formatDate('2026-06-01')).toBe('Jun 1');
    expect(formatDate('2026-06-09', { withYear: true })).toBe('Jun 9, 2026');
  });

  it('maps every month correctly', () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    months.forEach((name, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(formatDate(`2026-${mm}-15`)).toBe(`${name} 15`);
    });
  });

  it('is timezone-independent (guards the SSR/hydration match)', () => {
    // We parse by splitting the string, never `new Date('2026-01-01')` — which
    // would be UTC midnight and render as "Dec 31" in negative-offset zones.
    // The result must be the same regardless of the host timezone.
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/Los_Angeles';
      expect(formatDate('2026-01-01')).toBe('Jan 1');
      expect(formatDate('2026-12-31', { withYear: true })).toBe('Dec 31, 2026');
      process.env.TZ = 'Pacific/Kiritimati'; // UTC+14
      expect(formatDate('2026-01-01')).toBe('Jan 1');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('slugFromPath', () => {
  it('takes the filename without extension', () => {
    expect(slugFromPath('/content/blog/my-post.md')).toBe('my-post');
  });
});

describe('readingTime', () => {
  it('is at least 1 minute and scales with length', () => {
    expect(readingTime('one two three')).toBe('1 min read');
    expect(readingTime('word '.repeat(400))).toBe('2 min read');
  });
});

describe('excerptFromBody', () => {
  it('returns the first real paragraph, de-marked', () => {
    const body = '# Heading\n\nThis is **bold** and a [link](https://x).\n\nSecond.';
    expect(excerptFromBody(body)).toBe('This is bold and a link.');
  });
});

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('Short and sweet.', 160)).toBe('Short and sweet.');
  });

  it('returns text at exactly the limit unchanged', () => {
    const text = 'a'.repeat(20);
    expect(truncate(text, 20)).toBe(text);
  });

  it('cuts on a word boundary and appends an ellipsis', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const result = truncate(text, 20);
    expect(result).toBe('The quick brown fox…');
    expect(result.length).toBeLessThanOrEqual(21);
  });

  it('strips trailing punctuation before the ellipsis', () => {
    expect(truncate('Hello there, friend and more', 13)).toBe('Hello there…');
  });
});

describe('byDateDesc', () => {
  it('sorts newest-first and breaks ties on the secondary key', () => {
    const items = [
      { date: '2026-01-01', id: 'b' },
      { date: '2026-02-01', id: 'a' },
      { date: '2026-01-01', id: 'a' },
    ];
    const sorted = [...items].sort(byDateDesc((i) => i.id));
    expect(sorted.map((i) => `${i.date}:${i.id}`)).toEqual([
      '2026-02-01:a',
      '2026-01-01:a',
      '2026-01-01:b',
    ]);
  });
});
