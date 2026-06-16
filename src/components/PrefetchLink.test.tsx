import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrefetchLink } from './PrefetchLink';
import { prefetchImage } from './prefetch';

// jsdom has a real `Image`, but it doesn't network. Stub it with a mock that
// records every `src` assignment so we can assert what got prefetched.
let srcs: string[] = [];
class MockImage {
  #src = '';
  get src() {
    return this.#src;
  }
  set src(value: string) {
    this.#src = value;
    srcs.push(value);
  }
}

beforeEach(() => {
  srcs = [];
  vi.stubGlobal('Image', MockImage);
});

function renderLink(props: Partial<Parameters<typeof PrefetchLink>[0]> = {}) {
  return render(
    <MemoryRouter>
      <PrefetchLink to="/recipes/x" prefetch="/images/x.jpg" {...props}>
        Open
      </PrefetchLink>
    </MemoryRouter>,
  );
}

describe('prefetchImage', () => {
  it('does nothing without a url', () => {
    prefetchImage(undefined);
    prefetchImage('');
    expect(srcs).toHaveLength(0);
  });

  it('fetches a url once, even when called repeatedly (dedupe)', () => {
    // Unique per test so the module-level dedupe Set from other tests can't leak in.
    const url = '/images/dedupe-once.jpg';
    prefetchImage(url);
    prefetchImage(url);
    expect(srcs).toEqual([url]);
  });

  it('fetches distinct urls separately', () => {
    prefetchImage('/images/distinct-a.jpg');
    prefetchImage('/images/distinct-b.jpg');
    expect(srcs).toEqual(['/images/distinct-a.jpg', '/images/distinct-b.jpg']);
  });

  it('skips prefetch when the user has data-saver enabled', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } });
    prefetchImage('/images/save-data.jpg');
    expect(srcs).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});

describe('PrefetchLink', () => {
  it('renders as a link, forwarding children and to', () => {
    renderLink();
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', '/recipes/x');
  });

  it('prefetches the image on hover', () => {
    const url = '/images/hover.jpg';
    renderLink({ prefetch: url });
    fireEvent.mouseEnter(screen.getByRole('link'));
    expect(srcs).toContain(url);
  });

  it('prefetches the image on focus (keyboard)', () => {
    const url = '/images/focus.jpg';
    renderLink({ prefetch: url });
    fireEvent.focus(screen.getByRole('link'));
    expect(srcs).toContain(url);
  });

  it('prefetches only once across repeated hovers (dedupe)', () => {
    const url = '/images/hover-dedupe.jpg';
    renderLink({ prefetch: url });
    const link = screen.getByRole('link');
    fireEvent.mouseEnter(link);
    fireEvent.mouseEnter(link);
    expect(srcs.filter((s) => s === url)).toHaveLength(1);
  });

  it('does not prefetch when no prefetch url is given', () => {
    renderLink({ prefetch: undefined });
    fireEvent.mouseEnter(screen.getByRole('link'));
    expect(srcs).toHaveLength(0);
  });

  it('still runs a caller-supplied handler (composes, not replaces)', () => {
    const onMouseEnter = vi.fn();
    renderLink({ prefetch: '/images/compose.jpg', onMouseEnter });
    fireEvent.mouseEnter(screen.getByRole('link'));
    expect(onMouseEnter).toHaveBeenCalledOnce();
  });
});
