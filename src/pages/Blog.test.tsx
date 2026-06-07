import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { Blog } from './Blog';
import { getPosts, formatDate } from '../content';

function renderBlog() {
  return render(
    <MemoryRouter>
      <Blog />
    </MemoryRouter>,
    { wrapper: HelmetProvider },
  );
}

const posts = getPosts();

describe('Blog index', () => {
  it('renders one row per post, newest-first, each linking to its slug', () => {
    const { container } = renderBlog();
    const rows = container.querySelectorAll('a[href^="/blog/"]');
    expect(rows).toHaveLength(posts.length);

    // getPosts() is pre-sorted newest-first; rows preserve that order.
    posts.forEach((post, i) => {
      const row = rows[i];
      expect(row).toHaveAttribute('href', `/blog/${post.slug}`);
      const scope = within(row as HTMLElement);
      expect(scope.getByText(post.title)).toBeInTheDocument();
      expect(scope.getByText(post.excerpt)).toBeInTheDocument();
      expect(
        scope.getByText(formatDate(post.date, { withYear: true })),
      ).toBeInTheDocument();
    });
  });

  it('does not show reading time anywhere', () => {
    renderBlog();
    expect(screen.queryByText(/\bmin\b/i)).toBeNull();
  });

  it('renders no <main> of its own — Layout owns that landmark', () => {
    const { container } = renderBlog();
    expect(container.querySelector('main')).toBeNull();
  });
});
