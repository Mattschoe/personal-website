import { describe, it, expect } from 'vitest';
import { recipes, projects, posts } from './loader';
import { slugFromPath, readingTime, excerptFromBody, byDateDesc } from './derive';

describe('derive helpers', () => {
  it('derives a slug from the filename', () => {
    expect(slugFromPath('/content/blog/my-first-post.md')).toBe('my-first-post');
    expect(slugFromPath('/content/recipes/weeknight-tomato-soup.md')).toBe(
      'weeknight-tomato-soup',
    );
  });

  it('computes reading time at ~200 wpm, floored to 1 minute', () => {
    expect(readingTime('')).toBe('1 min read');
    expect(readingTime('word '.repeat(250))).toBe('2 min read'); // 250/200 → 2
    expect(readingTime('word '.repeat(450))).toBe('3 min read'); // 450/200 → 3
  });

  it('derives an excerpt from the first real paragraph, de-marked', () => {
    const body = '# A Heading\n\n**First** real _paragraph_.\n\nSecond paragraph.';
    expect(excerptFromBody(body)).toBe('First real paragraph.');
  });

  it('unwraps links and drops images when de-marking an excerpt', () => {
    const body = 'See ![chart](/a.png) the [docs](https://x.test) for more.';
    expect(excerptFromBody(body)).toBe('See the docs for more.');
  });
});

describe('byDateDesc comparator', () => {
  it('sorts newest-first and breaks ties by the secondary key', () => {
    const items = [
      { date: '2024-01-01', slug: 'b' },
      { date: '2024-03-01', slug: 'z' },
      { date: '2024-01-01', slug: 'a' },
    ];
    expect([...items].sort(byDateDesc((i) => i.slug)).map((i) => i.slug)).toEqual([
      'z',
      'a',
      'b',
    ]);
  });
});

describe('loaded streams', () => {
  it('load the seed content for every stream', () => {
    expect(recipes.length).toBeGreaterThan(0);
    expect(projects.length).toBeGreaterThan(0);
    expect(posts.length).toBeGreaterThan(0);
  });

  it('sort each stream newest-first', () => {
    const sorted = <T extends { date: string }>(items: readonly T[]) =>
      items.every((item, i) => i === 0 || items[i - 1].date >= item.date);
    expect(sorted(recipes)).toBe(true);
    expect(sorted(projects)).toBe(true);
    expect(sorted(posts)).toBe(true);
  });

  it('guarantees derived fields on loaded items', () => {
    for (const r of recipes) {
      expect(r.slug).toBeTruthy();
      expect(r.excerpt).toBeTruthy();
      expect(r.body).toBeTruthy();
    }
    for (const p of posts) {
      expect(p.slug).toBeTruthy();
      expect(p.excerpt).toBeTruthy();
      expect(p.readingTime).toMatch(/^\d+ min read$/);
    }
  });
});
