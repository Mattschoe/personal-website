import { describe, it, expect } from 'vitest';
import { buildSitemap, buildRss, buildCombinedFeed } from './feeds';
import { mergeFeed } from '../content/feed';
import { siteConfig } from './config';
import type { Recipe, Project, Post } from '../content/schema';

const recipes: Recipe[] = [
  {
    title: 'Skewers',
    date: '2025-01-02',
    slug: 'skewers',
    excerpt: 'Sticky & quick.',
    body: '',
    category: 'Dinner',
    time: '30 min',
    yield: '4',
    effort: 'Easy',
    ingredients: [{ amount: '2', item: 'thighs' }],
    steps: ['Grill.'],
  },
];

const projects: Project[] = [
  {
    title: 'This Site',
    date: '2025-02-01',
    slug: 'this-site',
    summary: 'A personal site.',
    body: '',
    status: 'Live',
    year: '2025',
    stack: ['React'],
    role: 'Everything',
  },
];

const posts: Post[] = [
  {
    title: 'Hello & Welcome',
    date: '2024-07-04',
    slug: 'hello-welcome',
    excerpt: 'First post <here>.',
    readingTime: '2 min read',
    body: '',
    tags: ['meta'],
  },
  {
    title: 'Second',
    date: '2024-08-10',
    slug: 'second',
    excerpt: 'Another one.',
    readingTime: '1 min read',
    body: '',
    tags: ['meta'],
  },
];

const content = { recipes, projects, posts };

/** Parse XML and fail the test on any parser error node. */
function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

describe('buildSitemap', () => {
  const xml = buildSitemap(content);
  const doc = parseXml(xml);

  it('lists every static route plus one <url> per content item', () => {
    const STATIC = 4; // /, /recipes, /projects, /blog
    const items = recipes.length + projects.length + posts.length;
    expect(doc.querySelectorAll('url').length).toBe(STATIC + items);
  });

  it('emits absolute <loc> URLs for every entry', () => {
    const locs = [...doc.querySelectorAll('loc')].map((n) => n.textContent ?? '');
    expect(locs.length).toBeGreaterThan(0);
    locs.forEach((loc) => expect(loc.startsWith(`${siteConfig.url}/`)).toBe(true));
    expect(locs).toContain(`${siteConfig.url}/blog/hello-welcome`);
    expect(locs).toContain(`${siteConfig.url}/`);
  });

  it('stamps <lastmod> from each item date', () => {
    const lastmods = [...doc.querySelectorAll('lastmod')].map((n) => n.textContent);
    expect(lastmods).toContain('2024-07-04');
  });
});

describe('buildRss', () => {
  const xml = buildRss(posts);
  const doc = parseXml(xml);

  it('has a single channel with one item per post', () => {
    expect(doc.querySelectorAll('channel').length).toBe(1);
    expect(doc.querySelectorAll('item').length).toBe(posts.length);
  });

  it('gives each item an absolute guid and RFC-822 pubDate', () => {
    const first = doc.querySelector('item')!;
    expect(first.querySelector('guid')?.textContent).toBe(
      `${siteConfig.url}/blog/hello-welcome`,
    );
    const pubDate = first.querySelector('pubDate')?.textContent ?? '';
    expect(pubDate).toBe('Thu, 04 Jul 2024 00:00:00 GMT');
  });

  it('escapes special characters in titles/descriptions', () => {
    // The raw string must not contain a bare unescaped ampersand or angle bracket
    // from the content; parsing already proved it is well-formed.
    expect(xml).toContain('Hello &amp; Welcome');
    expect(xml).toContain('First post &lt;here&gt;.');
  });
});

describe('buildCombinedFeed', () => {
  const merged = mergeFeed(recipes, projects, posts);
  const xml = buildCombinedFeed(merged);
  const doc = parseXml(xml);

  it('includes one item per item across all three streams', () => {
    expect(doc.querySelectorAll('item').length).toBe(merged.length);
    expect(merged.length).toBe(recipes.length + projects.length + posts.length);
  });

  it('tags each item with its stream category', () => {
    const cats = [...doc.querySelectorAll('category')].map((n) => n.textContent);
    expect(cats).toContain('recipe');
    expect(cats).toContain('project');
    expect(cats).toContain('essay');
  });

  it('orders items newest-first', () => {
    const links = [...doc.querySelectorAll('item > link')].map((n) => n.textContent);
    // project (2025-02-01) > recipe (2025-01-02) > posts (2024-...).
    expect(links[0]).toBe(`${siteConfig.url}/projects/this-site`);
    expect(links[1]).toBe(`${siteConfig.url}/recipes/skewers`);
  });
});
