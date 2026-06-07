import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { Seo } from './Seo';
import { siteConfig } from './config';

function renderSeo(ui: React.ReactNode, path = '/') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </HelmetProvider>,
  );
}

const head = () => document.head;

describe('Seo', () => {
  it('lands title, description and canonical in document.head', async () => {
    renderSeo(<Seo title="Blog" description="The blog." />, '/blog');

    await waitFor(() => expect(document.title).toBe('Blog — Matt'));
    expect(
      head().querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe('The blog.');
    expect(head().querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${siteConfig.url}/blog`,
    );
  });

  it('emits Open Graph and Twitter tags', async () => {
    renderSeo(<Seo title="Blog" description="The blog." />, '/blog');

    await waitFor(() =>
      expect(head().querySelector('meta[property="og:title"]')).not.toBeNull(),
    );
    expect(
      head().querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).toBe(`${siteConfig.url}/blog`);
    expect(
      head().querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
    ).toBe('summary');
    // No image → no image tags, and the small-summary card.
    expect(head().querySelector('meta[property="og:image"]')).toBeNull();
  });

  it('uses a large summary card and image tags when an image is given', async () => {
    renderSeo(
      <Seo title="A post" description="x" image="/images/x.jpg" type="article" />,
      '/blog/a-post',
    );

    await waitFor(() =>
      expect(head().querySelector('meta[property="og:image"]')).not.toBeNull(),
    );
    expect(
      head().querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ).toBe(`${siteConfig.url}/images/x.jpg`);
    expect(
      head().querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
    ).toBe('summary_large_image');
    expect(
      head().querySelector('meta[property="og:type"]')?.getAttribute('content'),
    ).toBe('article');
  });

  it('renders a JSON-LD script when provided', async () => {
    const jsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting' };
    renderSeo(<Seo title="A post" jsonLd={jsonLd} />, '/blog/a-post');

    await waitFor(() =>
      expect(
        head().querySelector('script[type="application/ld+json"]'),
      ).not.toBeNull(),
    );
    const script = head().querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script?.textContent ?? '{}')['@type']).toBe('BlogPosting');
  });

  it('escapes `<` so content cannot break out of the JSON-LD script', async () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Pwned </script><script>alert(1)</script>',
    };
    renderSeo(<Seo title="A post" jsonLd={jsonLd} />, '/blog/a-post');

    await waitFor(() =>
      expect(
        head().querySelector('script[type="application/ld+json"]'),
      ).not.toBeNull(),
    );
    const script = head().querySelector('script[type="application/ld+json"]');
    // The raw serialized text must not contain a literal `<`, and must still
    // round-trip back to the original value.
    expect(script?.textContent).not.toContain('<');
    expect(JSON.parse(script?.textContent ?? '{}').headline).toBe(
      'Pwned </script><script>alert(1)</script>',
    );
  });

  it('emits a noindex robots meta when flagged', async () => {
    renderSeo(<Seo title="Not found" noindex />, '/nope');

    await waitFor(() =>
      expect(head().querySelector('meta[name="robots"]')).not.toBeNull(),
    );
    expect(
      head().querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex');
  });
});
