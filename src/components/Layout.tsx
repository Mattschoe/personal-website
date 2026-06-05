import { Outlet } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider';
import { Header } from './Header';
import { Footer } from './Footer';

// Persistent chrome wrapping every route. ThemeProvider sits at the top so both
// the header and footer toggles share one theme state.
export function Layout() {
  return (
    <ThemeProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
