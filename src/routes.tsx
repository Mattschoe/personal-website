import type { RouteRecord } from 'vite-react-ssg';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Recipes } from './pages/Recipes';
import { Projects } from './pages/Projects';
import { Blog } from './pages/Blog';
import { NotFound } from './pages/NotFound';

// A single layout route renders the persistent chrome (Header/Footer/theme) and
// an <Outlet> for each child. The dynamic content routes (/recipes/:slug, etc.)
// are added in Phase 3; '*' catches unknown paths.
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'recipes', element: <Recipes /> },
      { path: 'projects', element: <Projects /> },
      { path: 'blog', element: <Blog /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
