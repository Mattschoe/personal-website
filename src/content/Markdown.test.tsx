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
});
