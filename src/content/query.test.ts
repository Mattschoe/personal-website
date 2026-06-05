import { describe, it, expect } from 'vitest';
import {
  getRecipes,
  getProjects,
  getPosts,
  getRecipe,
  getProject,
  getPost,
  getLatestFeed,
} from './index';

describe('single-item getters', () => {
  it('return the matching item by slug, or undefined', () => {
    const first = getRecipes()[0];
    expect(getRecipe(first.slug)).toBe(first);
    expect(getRecipe('does-not-exist')).toBeUndefined();

    expect(getProject(getProjects()[0].slug)?.slug).toBe(getProjects()[0].slug);
    expect(getProject('nope')).toBeUndefined();

    expect(getPost(getPosts()[0].slug)?.slug).toBe(getPosts()[0].slug);
    expect(getPost('nope')).toBeUndefined();
  });
});

describe('getLatestFeed', () => {
  it('merges all three streams', () => {
    const total = getRecipes().length + getProjects().length + getPosts().length;
    expect(getLatestFeed()).toHaveLength(total);
  });

  it('is sorted newest-first', () => {
    const feed = getLatestFeed();
    expect(feed.every((item, i) => i === 0 || feed[i - 1].date >= item.date)).toBe(true);
  });

  it('maps each type to its tone and href prefix', () => {
    const toneByType = { recipe: 'grenadine', project: 'sage', essay: 'beeswax' } as const;
    const prefixByType = { recipe: '/recipes/', project: '/projects/', essay: '/blog/' } as const;
    for (const item of getLatestFeed()) {
      expect(item.tone).toBe(toneByType[item.type]);
      expect(item.href.startsWith(prefixByType[item.type])).toBe(true);
      expect(item.excerpt).toBeTruthy();
    }
  });

  it('respects the limit argument', () => {
    expect(getLatestFeed(3)).toHaveLength(3);
    expect(getLatestFeed(0)).toHaveLength(0);
  });
});
