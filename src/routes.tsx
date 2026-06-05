import type { RouteRecord } from 'vite-react-ssg';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Recipes } from './pages/Recipes';
import { RecipeDetail } from './pages/RecipeDetail';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Blog } from './pages/Blog';
import { PostDetail } from './pages/PostDetail';
import { NotFound } from './pages/NotFound';
import { getRecipes, getProjects, getPosts } from './content';

// A single layout route renders the persistent chrome (Header/Footer/theme) and
// an <Outlet> for each child. The dynamic content routes are generated from the
// content layer via `getStaticPaths` — drop a Markdown file in and it prerenders
// on the next build with no edit here. '*' catches unknown paths and stays last.
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'recipes', element: <Recipes /> },
      {
        path: 'recipes/:slug',
        element: <RecipeDetail />,
        getStaticPaths: () => getRecipes().map((r) => `/recipes/${r.slug}`),
      },
      { path: 'projects', element: <Projects /> },
      {
        path: 'projects/:slug',
        element: <ProjectDetail />,
        getStaticPaths: () => getProjects().map((p) => `/projects/${p.slug}`),
      },
      { path: 'blog', element: <Blog /> },
      {
        path: 'blog/:slug',
        element: <PostDetail />,
        getStaticPaths: () => getPosts().map((p) => `/blog/${p.slug}`),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
];
