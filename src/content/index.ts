import { recipes, projects, posts } from './loader';
import { byDateDesc } from './derive';
import type { Recipe, Project, Post, FeedItem } from './schema';

export type { Recipe, Project, Post, FeedItem } from './schema';

// Typed query API over the content layer. All arrays are pre-sorted newest-first
// by the loader. These are the only functions pages should reach for — they keep
// the content shape (and the "Latest" merge) in one place.

export function getRecipes(): readonly Recipe[] {
  return recipes;
}

export function getProjects(): readonly Project[] {
  return projects;
}

export function getPosts(): readonly Post[] {
  return posts;
}

export function getRecipe(slug: string): Recipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

// Category colour-coding (SPEC §4): recipe → Grenadine, project → Sage,
// essay → Beeswax. Drives the `.tag--*` pill tone on each feed card.
function recipeToFeed(r: Recipe): FeedItem {
  return {
    type: 'recipe',
    title: r.title,
    date: r.date,
    excerpt: r.excerpt,
    href: `/recipes/${r.slug}`,
    tone: 'grenadine',
  };
}

function projectToFeed(p: Project): FeedItem {
  return {
    type: 'project',
    title: p.title,
    date: p.date,
    excerpt: p.summary,
    href: `/projects/${p.slug}`,
    tone: 'sage',
  };
}

function postToFeed(p: Post): FeedItem {
  return {
    type: 'essay',
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    href: `/blog/${p.slug}`,
    tone: 'beeswax',
  };
}

/**
 * The Home "Latest" feed: a date-sorted merge of all three streams, normalised
 * to {type,title,date,excerpt,href,tone} (SPEC §9). Never hand-maintained.
 * Returns every item newest-first; pass `limit` to take the top N.
 */
export function getLatestFeed(limit?: number): FeedItem[] {
  const merged: FeedItem[] = [
    ...recipes.map(recipeToFeed),
    ...projects.map(projectToFeed),
    ...posts.map(postToFeed),
  ].sort(byDateDesc((item) => item.href));
  return limit === undefined ? merged : merged.slice(0, limit);
}
