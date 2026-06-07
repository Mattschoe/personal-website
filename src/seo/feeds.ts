import { absoluteUrl } from './meta';
import { siteConfig } from './config';
import type { Recipe, Project, Post, FeedItem } from '../content/schema';

// Pure XML string builders for the sitemap and the two RSS feeds. They take
// already-loaded content arrays and return well-formed XML — no filesystem, no
// virtual module — so they're unit-testable and reusable from the Node
// generator (src/seo/generate.ts).

/** Escape the five XML special characters for safe text/attribute content. */
function xml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** `YYYY-MM-DD` → RFC-822 date (e.g. `Thu, 04 Jul 2024 00:00:00 GMT`) for RSS
 *  `pubDate`. Anchored to UTC midnight so build (Node) output is deterministic. */
function rfc822(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toUTCString();
}

// The four static, always-present routes. Content detail routes are appended
// per item below — adding a Markdown file therefore adds a sitemap entry with
// no code change (CLAUDE.md Rule 4).
const STATIC_ROUTES = ['/', '/recipes', '/projects', '/blog'] as const;

export interface SitemapContent {
  recipes: readonly Recipe[];
  projects: readonly Project[];
  posts: readonly Post[];
}

/** `sitemap.xml`: every static route plus one `<url>` per content item. */
export function buildSitemap(content: SitemapContent): string {
  const entries: { loc: string; lastmod?: string }[] = [
    ...STATIC_ROUTES.map((r) => ({ loc: absoluteUrl(r) })),
    ...content.recipes.map((r) => ({ loc: absoluteUrl(`/recipes/${r.slug}`), lastmod: r.date })),
    ...content.projects.map((p) => ({ loc: absoluteUrl(`/projects/${p.slug}`), lastmod: p.date })),
    ...content.posts.map((p) => ({ loc: absoluteUrl(`/blog/${p.slug}`), lastmod: p.date })),
  ];

  const urls = entries
    .map(
      ({ loc, lastmod }) =>
        `  <url>\n    <loc>${xml(loc)}</loc>` +
        (lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '') +
        `\n  </url>`,
    )
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

/** A single RSS `<item>` block. */
function rssItem(opts: {
  title: string;
  link: string;
  date: string;
  description: string;
  category?: string;
}): string {
  return (
    `    <item>\n` +
    `      <title>${xml(opts.title)}</title>\n` +
    `      <link>${xml(opts.link)}</link>\n` +
    `      <guid isPermaLink="true">${xml(opts.link)}</guid>\n` +
    `      <pubDate>${rfc822(opts.date)}</pubDate>\n` +
    (opts.category ? `      <category>${xml(opts.category)}</category>\n` : '') +
    `      <description>${xml(opts.description)}</description>\n` +
    `    </item>`
  );
}

/** Wrap `<item>` blocks in an RSS 2.0 `<channel>`. */
function rssChannel(opts: {
  title: string;
  link: string;
  description: string;
  items: string;
}): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n` +
    `  <channel>\n` +
    `    <title>${xml(opts.title)}</title>\n` +
    `    <link>${xml(opts.link)}</link>\n` +
    `    <description>${xml(opts.description)}</description>\n` +
    `${opts.items}\n` +
    `  </channel>\n` +
    `</rss>\n`
  );
}

/** `rss.xml`: the blog feed, one `<item>` per post. */
export function buildRss(posts: readonly Post[]): string {
  const items = posts
    .map((p) =>
      rssItem({
        title: p.title,
        link: absoluteUrl(`/blog/${p.slug}`),
        date: p.date,
        description: p.excerpt,
      }),
    )
    .join('\n');

  return rssChannel({
    title: `${siteConfig.name} — Blog`,
    link: absoluteUrl('/blog'),
    description: 'Essays and notes from Matt.',
    items,
  });
}

/** `feed.xml`: the combined all-streams feed from the normalised FeedItem merge. */
export function buildCombinedFeed(items: readonly FeedItem[]): string {
  const body = items
    .map((i) =>
      rssItem({
        title: i.title,
        link: absoluteUrl(i.href),
        date: i.date,
        description: i.excerpt,
        category: i.type,
      }),
    )
    .join('\n');

  return rssChannel({
    title: `${siteConfig.name} — Latest`,
    link: siteConfig.url,
    description: siteConfig.description,
    items: body,
  });
}
