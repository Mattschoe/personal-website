// Single source of truth for site-wide SEO metadata. Both the runtime <Seo>
// component and the build-time feed/sitemap generator read from here, so the
// production URL and site blurb live in exactly one place.
//
// The origin is overridable via `VITE_SITE_URL` so Phase 10's deploy can point a
// staging/preview build at a different host without touching code. We read it
// from two places because this module runs in two contexts:
//   - In the client/SSG graph, Vite statically replaces `import.meta.env.*`.
//   - In the build-time sitemap/RSS generator (plain Node, run from the
//     `onFinished` hook), `import.meta.env` is undefined — there we read
//     `process.env`. Without this, the generated XML would silently keep the
//     hardcoded default while the prerendered pages used the override, leaving
//     canonical URLs and the sitemap pointing at different origins.
const envUrl =
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : undefined) ??
  (typeof process !== 'undefined' ? process.env?.VITE_SITE_URL : undefined);

export const siteConfig = {
  // Production origin, no trailing slash.
  url: (envUrl ?? 'https://mattschoe.dev').replace(/\/+$/, ''),
  name: 'Matt',
  // Matches the static <title> in index.html (the pre-hydration fallback).
  title: 'Matt — essays, recipes & software',
  // TODO(copy): replace with Matt's real one-line site blurb.
  description:
    'Matt builds software, cooks, and writes — essays, recipes, and project case studies in one place.',
  author: 'Matthias Nielsen',
  locale: 'en',
  social: {
    github: 'https://github.com/Mattschoe',
    linkedin: 'https://www.linkedin.com/in/matthias-s-nielsen',
    email: 'matthias.s.nielsen@protonmail.com',
  },
} as const;
