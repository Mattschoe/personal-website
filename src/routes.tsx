import type { RouteRecord } from 'vite-react-ssg';
import { Placeholder } from './pages/Placeholder';

// Static route config consumed by vite-react-ssg. The dynamic content routes
// (/recipes/:slug, /blog/:slug, /projects/:slug) are wired up in Phase 3.
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Placeholder />,
  },
];
