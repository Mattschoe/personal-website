import './styles/global.css';
import './styles/app.css';
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';

// vite-react-ssg entry: prerenders every route in `routes` to static HTML at build time,
// and hydrates the same tree in the browser.
export const createRoot = ViteReactSSG({ routes });
