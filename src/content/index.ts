import { recipes, projects, posts } from './loader';
import { mergeFeed } from './feed';
import type { Recipe, Project, Post, FeedItem } from './schema';

export type { Recipe, Project, Post, FeedItem } from './schema';
export { formatDate } from './derive';

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

/**
 * The Home "Latest" feed: a date-sorted merge of all three streams, normalised
 * to {type,title,date,excerpt,href,tone} (SPEC §9). The mapping/merge lives in
 * `./feed` so the build-time combined-RSS generator reuses it. Never hand-
 * maintained. Returns every item newest-first; pass `limit` to take the top N.
 */
export function getLatestFeed(limit?: number): FeedItem[] {
  const merged = mergeFeed(recipes, projects, posts);
  return limit === undefined ? merged : merged.slice(0, limit);
}
