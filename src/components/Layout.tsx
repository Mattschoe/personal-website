import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider';
import { Header } from './Header';
import { Footer } from './Footer';

// React Router preserves window scroll across navigations, which lands a new page
// mid-scroll. On every route change reset to the top — unless the URL carries a
// hash, in which case scroll its target into view (e.g. the header's /#about).
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// Persistent chrome wrapping every route. ThemeProvider sits at the top so both
// the header and footer toggles share one theme state.
export function Layout() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
