import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { PostDetail } from './PostDetail';
import { getPosts, formatDate } from '../content';

function renderPost(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<PostDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

// Newest post (getPosts() is pre-sorted newest-first); its body starts with a
// real paragraph, so it exercises the drop-cap path.
const post = getPosts()[0];

describe('PostDetail', () => {
  it('renders the Essay tag, crumb, title and year-stamped byline date', () => {
    renderPost(post.slug);

    const tag = screen.getByText('Essay', { selector: '.tag' });
    expect(tag).toHaveClass('tag', 'tag--essay');

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: post.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDate(post.date, { withYear: true })),
    ).toBeInTheDocument();
  });

  it('drop-caps the first paragraph of the body only', () => {
    const { container } = renderPost(post.slug);
    const paragraphs = container.querySelectorAll('.read p');
    expect(paragraphs.length).toBeGreaterThan(0);
    expect(paragraphs[0]).toHaveClass('dropcap');
    Array.from(paragraphs)
      .slice(1)
      .forEach((p) => expect(p).not.toHaveClass('dropcap'));
  });

  it('renders a tag row with #-prefixed front-matter tags', () => {
    const { container } = renderPost(post.slug);
    const tagRow = container.querySelector('[class*="tagRow"]');
    expect(tagRow).not.toBeNull();
    const scope = within(tagRow as HTMLElement);
    post.tags.forEach((t) => {
      expect(scope.getByText(`#${t}`)).toBeInTheDocument();
    });
  });

  it('shows no reading time and no "keep reading" section', () => {
    renderPost(post.slug);
    expect(screen.queryByText(/\bmin\b/i)).toBeNull();
    expect(screen.queryByText(/keep reading/i)).toBeNull();
    expect(screen.queryByText(/more from the blog/i)).toBeNull();
  });

  it('renders NotFound for an unknown slug', () => {
    renderPost('does-not-exist');
    expect(screen.queryByRole('heading', { level: 1, name: post.title })).toBeNull();
    // NotFound surfaces a 404-style message.
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
