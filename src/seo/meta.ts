import { siteConfig } from './config';
import type { Post, Recipe } from '../content/schema';

// Pure, dependency-free meta builders shared by the runtime <Seo> component and
// the build-time generators. Nothing here touches the DOM or the filesystem, so
// the same functions run in the browser, in Node, and under Vitest. Keeping the
// URL/string logic here (and unit-tested) means <Seo> stays a thin props→tags
// map and the generators stay thin content→XML wrappers.

/** Join `siteConfig.url` + a path into an absolute URL, normalising slashes.
 *  Already-absolute (http/https) inputs — e.g. an external hero — pass through. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const rel = path.startsWith('/') ? path : `/${path}`;
  return siteConfig.url + rel;
}

/** The bare page title (subpages), or the site title for Home (no `title`). */
export function pageTitle(title?: string): string {
  return title ?? siteConfig.title;
}

export type SeoType = 'website' | 'article';

export interface SeoInput {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  type?: SeoType;
  noindex?: boolean;
}

/** Plain object of the tags <Seo> emits. `image` is absolutised and the og/
 *  twitter image fields are omitted entirely when no image is supplied. */
export interface SeoTags {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  ogType: SeoType;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage?: string;
  ogSiteName: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;
}

export function buildSeo(input: SeoInput): SeoTags {
  const title = pageTitle(input.title);
  const description = input.description ?? siteConfig.description;
  const canonical = absoluteUrl(input.path);
  const image = input.image ? absoluteUrl(input.image) : undefined;
  const type = input.type ?? 'website';

  return {
    title,
    description,
    canonical,
    noindex: input.noindex ?? false,
    ogType: type,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ...(image ? { ogImage: image } : {}),
    ogSiteName: siteConfig.name,
    twitterCard: image ? 'summary_large_image' : 'summary',
    twitterTitle: title,
    twitterDescription: description,
    ...(image ? { twitterImage: image } : {}),
  };
}

// JSON-LD builders. Dates come straight from `item.date` (already a `YYYY-MM-DD`
// ISO string), which schema.org accepts as an ISO 8601 date.

/** schema.org `BlogPosting` for a blog post. */
export function articleJsonLd(post: Post): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: siteConfig.author },
    url: absoluteUrl(`/blog/${post.slug}`),
    ...(post.hero ? { image: absoluteUrl(post.hero) } : {}),
  };
}

/** schema.org `Recipe` for a recipe. */
export function recipeJsonLd(recipe: Recipe): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.excerpt,
    datePublished: recipe.date,
    author: { '@type': 'Person', name: siteConfig.author },
    url: absoluteUrl(`/recipes/${recipe.slug}`),
    recipeCategory: recipe.category,
    recipeYield: recipe.yield,
    totalTime: recipe.time,
    recipeIngredient: recipe.ingredients.map((i) => `${i.amount} ${i.item}`.trim()),
    recipeInstructions: recipe.steps.map((text) => ({ '@type': 'HowToStep', text })),
    ...(recipe.hero ? { image: absoluteUrl(recipe.hero) } : {}),
  };
}
