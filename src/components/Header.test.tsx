import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { Header } from './Header';

function renderHeader(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('marks the matching nav link with aria-current', () => {
    renderHeader('/recipes');
    const primary = screen.getByRole('navigation', { name: 'Primary' });
    const recipes = within(primary).getByRole('link', { name: 'Recipes' });
    const home = within(primary).getByRole('link', { name: 'Home' });
    expect(recipes).toHaveAttribute('aria-current', 'page');
    expect(home).not.toHaveAttribute('aria-current', 'page');
  });

  it('toggles the mobile drawer via aria-expanded', () => {
    renderHeader();
    const menu = screen.getByRole('button', { name: /open menu/i });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull();

    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();
  });

  it('closes the drawer on Escape', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull();
  });

  it('closes the drawer when a nav link is selected', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile' });
    fireEvent.click(within(mobileNav).getByRole('link', { name: 'Blog' }));
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull();
  });

  describe('resize past the mobile breakpoint', () => {
    const original = window.matchMedia;
    let listeners: Set<(e: MediaQueryListEvent) => void>;

    beforeEach(() => {
      listeners = new Set();
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
          listeners.add(cb),
        removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
          listeners.delete(cb),
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = original;
    });

    it('closes an open drawer when the viewport grows past 640px', () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
      expect(
        screen.getByRole('navigation', { name: 'Mobile' }),
      ).toBeInTheDocument();

      act(() => {
        listeners.forEach((cb) =>
          cb({ matches: true } as MediaQueryListEvent),
        );
      });
      expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull();
    });
  });
});
