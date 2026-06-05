import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';

// React port of design-reference/theme.js. The pre-paint inline snippet in
// index.html is the source of truth for the *initial* theme (it reads
// localStorage["matt-theme"], falling back to prefers-color-scheme, and sets
// data-theme on <html> before first paint). This provider mirrors that state
// into React and owns flipping it from the toggle buttons.

const STORAGE_KEY = 'matt-theme';

function readDomTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from a stable default so the server-rendered HTML and the first
  // client render agree (no hydration mismatch); re-sync to the real DOM theme
  // — already set pre-paint by the head snippet — right after mount.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readDomTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore (e.g. private mode / storage disabled)
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
