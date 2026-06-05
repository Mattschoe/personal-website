import { describe, it, expect } from 'vitest';
import { routes } from './routes';
import { getRecipes, getProjects, getPosts } from './content';

// The content streams should each generate one static path per file, so dropping
// a Markdown file in gives it a prerendered route with no edit to routes.tsx.
const children = routes[0].children ?? [];
const pathsFor = (routePath: string): string[] => {
  const route = children.find((c) => 'path' in c && c.path === routePath);
  const getStaticPaths = route && 'getStaticPaths' in route ? route.getStaticPaths : undefined;
  return getStaticPaths ? (getStaticPaths() as string[]) : [];
};

describe('content-driven static paths', () => {
  it('generates one /recipes/:slug path per recipe', () => {
    const paths = pathsFor('recipes/:slug');
    expect(paths).toHaveLength(getRecipes().length);
    expect(paths).toEqual(getRecipes().map((r) => `/recipes/${r.slug}`));
  });

  it('generates one /projects/:slug path per project', () => {
    const paths = pathsFor('projects/:slug');
    expect(paths).toEqual(getProjects().map((p) => `/projects/${p.slug}`));
  });

  it('generates one /blog/:slug path per post', () => {
    const paths = pathsFor('blog/:slug');
    expect(paths).toEqual(getPosts().map((p) => `/blog/${p.slug}`));
  });

  it('keeps the catch-all route last', () => {
    const last = children[children.length - 1];
    expect('path' in last && last.path).toBe('*');
  });
});
