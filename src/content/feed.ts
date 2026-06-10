import { byDateDesc } from './derive';
import type { Recipe, Project, Post, FeedItem } from './schema';

// Pure mappers that normalise each stream's item into the shared `FeedItem`
// shape (SPEC §9), plus the date-sorted merge. Lifted out of the query layer so
// both the runtime "Latest" feed (src/content/index.ts) and the build-time
// combined RSS generator (src/seo) build the feed from the exact same logic.
// Nothing here imports the virtual content module, so it's Node-safe.
//
// Category colour-coding: recipe → Grenadine, project → Sage, essay → Beeswax.

export function recipeToFeed(r: Recipe): FeedItem {
  return {
    type: 'recipe',
    title: r.title,
    date: r.date,
    excerpt: r.excerpt,
    caption: r.caption,
    href: `/recipes/${r.slug}`,
    tone: 'grenadine',
    hero: r.hero,
    heroAlt: r.heroAlt,
  };
}

export function projectToFeed(p: Project): FeedItem {
  return {
    type: 'project',
    title: p.title,
    date: p.date,
    excerpt: p.summary,
    caption: p.caption,
    href: `/projects/${p.slug}`,
    tone: 'sage',
    hero: p.hero,
    heroAlt: p.heroAlt,
  };
}

export function postToFeed(p: Post): FeedItem {
  return {
    type: 'essay',
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    caption: p.caption,
    href: `/blog/${p.slug}`,
    tone: 'beeswax',
    hero: p.hero,
    heroAlt: p.heroAlt,
  };
}

/** Date-sorted (newest-first) merge of all three streams into FeedItems. */
export function mergeFeed(
  recipes: readonly Recipe[],
  projects: readonly Project[],
  posts: readonly Post[],
): FeedItem[] {
  return [
    ...recipes.map(recipeToFeed),
    ...projects.map(projectToFeed),
    ...posts.map(postToFeed),
  ].sort(byDateDesc((item) => item.href));
}
