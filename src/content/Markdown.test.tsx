import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { Markdown } from './Markdown';
import { getPosts } from './index';

// Guards the SSG → hydrate path: a server/client mismatch in the Markdown output
// (or a missing `Buffer` shim in the loader) only shows up as a minified error in
// the built site, so reproduce it here with development React, which surfaces the
// exact warning.
describe('Markdown hydration', () => {
  it('hydrates a post body without a mismatch warning', async () => {
    const body = getPosts()[0].body;
    const tree = <Markdown>{body}</Markdown>;

    const html = renderToString(tree);
    const container = document.createElement('div');
    container.innerHTML = html;

    const errors: string[] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    };

    await act(async () => {
      hydrateRoot(container, tree);
    });

    console.error = origError;
    if (errors.length) console.log('HYDRATION ERRORS:\n' + errors.join('\n---\n'));
    expect(errors).toEqual([]);
  });

  it('typesets inline and block math via KaTeX', () => {
    const html = renderToString(
      <Markdown>{'Inline $a^2 + b^2 = c^2$ and a block:\n\n$$\n\\frac{1}{2}\n$$'}</Markdown>,
    );
    // rehype-katex emits a .katex span for the inline math and a .katex-display
    // wrapper for the fenced `$$` block (the raw TeX is retained only inside
    // KaTeX's MathML <annotation>, which is why we assert on the wrappers).
    expect(html).toContain('katex');
    expect(html).toContain('katex-display');
  });

  it('renders a GFM table', () => {
    const html = renderToString(
      <Markdown>{'| A | B |\n|---|---|\n| 1 | 2 |'}</Markdown>,
    );
    expect(html).toContain('<table>');
    expect(html).toContain('<th>A</th>');
  });

  it('renders an inline image with a title as a captioned figure', () => {
    const html = renderToString(
      <Markdown>{'![A platter](/images/blog/platter.jpg "Sunday lunch")'}</Markdown>,
    );
    expect(html).toContain('<figure>');
    expect(html).toContain('<img');
    expect(html).toContain('alt="A platter"');
    expect(html).toContain('<figcaption>Sunday lunch</figcaption>');
  });

  it('renders an inline image without a title and without a caption', () => {
    const html = renderToString(
      <Markdown>{'![A platter](/images/blog/platter.jpg)'}</Markdown>,
    );
    expect(html).toContain('<figure>');
    expect(html).toContain('<img');
    expect(html).not.toContain('<figcaption');
  });

  it('does not wrap a lone inline image in a paragraph', () => {
    // rehype-unwrap-images strips the wrapping <p>; without it the <figure>
    // would nest inside a <p> (invalid HTML → hydration mismatch in the build).
    const html = renderToString(
      <Markdown>{'![A platter](/images/blog/platter.jpg)'}</Markdown>,
    );
    expect(html).not.toContain('<p>');
  });
});
