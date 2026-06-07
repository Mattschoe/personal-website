import { Head } from 'vite-react-ssg';
import { useLocation } from 'react-router-dom';
import { buildSeo, type SeoType } from './meta';

// Thin map from props → head tags. Wraps vite-react-ssg's <Head> (react-helmet-
// async under the hood — already a transitive dep, no new package). The canonical
// path comes from the router's current pathname, which is SSG-safe: each route is
// prerendered at its own path, so the static HTML gets the right canonical URL.
//
// Lives inside each page's rendered JSX (not the layout) so detail pages that
// early-return <NotFound/> never emit a stale title for a missing item.

/** Serialize JSON-LD for inline injection. Escapes `<` so a stray `</script>`
 *  (or `<!--`) in trusted content can't break out of the script element. */
function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

interface SeoProps {
  /** Page title; omitted on Home to use the bare site title. */
  title?: string;
  description?: string;
  /** An item `hero` path; absolutised for og/twitter image. */
  image?: string;
  type?: SeoType;
  /** schema.org JSON-LD object (e.g. BlogPosting / Recipe). */
  jsonLd?: Record<string, unknown>;
  /** Emit `robots: noindex` (e.g. the 404 page). */
  noindex?: boolean;
}

export function Seo({ title, description, image, type, jsonLd, noindex }: SeoProps) {
  const { pathname } = useLocation();
  const tags = buildSeo({ title, description, path: pathname, image, type, noindex });

  return (
    <Head>
      <title>{tags.title}</title>
      <meta name="description" content={tags.description} />
      <link rel="canonical" href={tags.canonical} />
      {tags.noindex && <meta name="robots" content="noindex" />}

      <meta property="og:type" content={tags.ogType} />
      <meta property="og:title" content={tags.ogTitle} />
      <meta property="og:description" content={tags.ogDescription} />
      <meta property="og:url" content={tags.ogUrl} />
      <meta property="og:site_name" content={tags.ogSiteName} />
      {tags.ogImage && <meta property="og:image" content={tags.ogImage} />}

      <meta name="twitter:card" content={tags.twitterCard} />
      <meta name="twitter:title" content={tags.twitterTitle} />
      <meta name="twitter:description" content={tags.twitterDescription} />
      {tags.twitterImage && <meta name="twitter:image" content={tags.twitterImage} />}

      {jsonLd && (
        <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>
      )}
    </Head>
  );
}
