import { describe, it, expect } from 'vitest';
import {
  absoluteUrl,
  pageTitle,
  buildSeo,
  articleJsonLd,
  recipeJsonLd,
} from './meta';
import { siteConfig } from './config';
import type { Post, Recipe } from '../content/schema';

describe('absoluteUrl', () => {
  it('joins a root-relative path onto the site origin', () => {
    expect(absoluteUrl('/blog')).toBe(`${siteConfig.url}/blog`);
    expect(absoluteUrl('/blog/my-post')).toBe(`${siteConfig.url}/blog/my-post`);
  });

  it('maps "/" to the origin with a single trailing slash', () => {
    expect(absoluteUrl('/')).toBe(`${siteConfig.url}/`);
  });

  it('normalises a missing leading slash', () => {
    expect(absoluteUrl('images/x.jpg')).toBe(`${siteConfig.url}/images/x.jpg`);
  });

  it('passes already-absolute URLs through untouched', () => {
    const ext = 'https://cdn.example.com/a.jpg';
    expect(absoluteUrl(ext)).toBe(ext);
    expect(absoluteUrl('http://example.com/b')).toBe('http://example.com/b');
  });
});

describe('pageTitle', () => {
  it('suffixes a page title with the site name', () => {
    expect(pageTitle('Recipes')).toBe('Recipes — Matt');
  });

  it('uses the bare site title for Home (no title)', () => {
    expect(pageTitle()).toBe(siteConfig.title);
  });
});

describe('buildSeo', () => {
  it('omits image fields entirely when no image is supplied', () => {
    const tags = buildSeo({ title: 'Blog', path: '/blog' });
    expect(tags.ogImage).toBeUndefined();
    expect(tags.twitterImage).toBeUndefined();
    expect(tags.twitterCard).toBe('summary');
  });

  it('absolutises the image and switches to a large card when present', () => {
    const tags = buildSeo({ title: 'A post', path: '/blog/x', image: '/images/x.jpg' });
    expect(tags.ogImage).toBe(`${siteConfig.url}/images/x.jpg`);
    expect(tags.twitterImage).toBe(`${siteConfig.url}/images/x.jpg`);
    expect(tags.twitterCard).toBe('summary_large_image');
  });

  it('derives canonical from path and defaults type to website', () => {
    const tags = buildSeo({ title: 'Blog', path: '/blog' });
    expect(tags.canonical).toBe(`${siteConfig.url}/blog`);
    expect(tags.ogUrl).toBe(`${siteConfig.url}/blog`);
    expect(tags.ogType).toBe('website');
  });

  it('falls back to the site description when none is given', () => {
    const tags = buildSeo({ title: 'Blog', path: '/blog' });
    expect(tags.description).toBe(siteConfig.description);
  });

  it('honours an explicit article type and noindex flag', () => {
    const tags = buildSeo({ title: 'X', path: '/x', type: 'article', noindex: true });
    expect(tags.ogType).toBe('article');
    expect(tags.noindex).toBe(true);
  });
});

const post: Post = {
  title: 'My First Post',
  date: '2024-07-04',
  slug: 'my-first-post',
  excerpt: 'A short blurb.',
  readingTime: '3 min read',
  body: 'Body.',
  tags: ['react', 'ssg'],
  hero: '/images/post.jpg',
};

const recipe: Recipe = {
  title: 'Teriyaki Skewers',
  date: '2025-01-02',
  slug: 'teriyaki-skewers',
  excerpt: 'Sticky and quick.',
  body: 'Body.',
  category: 'Dinner',
  time: '30 min',
  yield: '4 skewers',
  effort: 'Easy',
  ingredients: [{ amount: '2', item: 'chicken thighs' }],
  steps: ['Skewer.', 'Grill.'],
};

describe('articleJsonLd', () => {
  it('produces a BlogPosting with required fields and ISO dates', () => {
    const ld = articleJsonLd(post);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('My First Post');
    expect(ld.datePublished).toBe('2024-07-04');
    expect(ld.url).toBe(`${siteConfig.url}/blog/my-first-post`);
    expect(ld.image).toBe(`${siteConfig.url}/images/post.jpg`);
    expect(ld.author).toEqual({ '@type': 'Person', name: siteConfig.author });
  });

  it('omits image when the post has no hero', () => {
    const ld = articleJsonLd({ ...post, hero: undefined });
    expect(ld.image).toBeUndefined();
  });
});

describe('recipeJsonLd', () => {
  it('produces a Recipe with ingredients and HowToStep instructions', () => {
    const ld = recipeJsonLd(recipe);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Recipe');
    expect(ld.name).toBe('Teriyaki Skewers');
    expect(ld.datePublished).toBe('2025-01-02');
    expect(ld.recipeIngredient).toEqual(['2 chicken thighs']);
    expect(ld.recipeInstructions).toEqual([
      { '@type': 'HowToStep', text: 'Skewer.' },
      { '@type': 'HowToStep', text: 'Grill.' },
    ]);
    expect(ld.url).toBe(`${siteConfig.url}/recipes/teriyaki-skewers`);
  });
});
