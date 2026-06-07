import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { contentPlugin } from './vite-plugin-content';

// https://vite.dev/config/ — Vitest config is merged in via vitest/config's defineConfig.
export default defineConfig({
  // contentPlugin parses content/ at build time into the `virtual:content` module.
  plugins: [react(), contentPlugin()],
  // vite-react-ssg reads ssgOptions during `vite-react-ssg build`.
  ssgOptions: {
    // Routes come from src/routes.tsx. After all pages are prerendered, generate
    // the sitemap + RSS feeds into dist/. generate.ts reads content via the Node
    // reader (read.node.ts), never `virtual:content`, so it's safe in this hook.
    onFinished: async (outDir: string) => {
      const { generateSeoArtifacts } = await import('./src/seo/generate');
      generateSeoArtifacts(outDir);
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // react-helmet-async is a transitive dep of vite-react-ssg, peer-pinned to
    // React <19 so it can't hoist to the project root under React 19. Alias the
    // bare specifier to that one copy so Seo.test.tsx can wrap <Seo> in the same
    // HelmetProvider instance that vite-react-ssg's <Head> reads from.
    alias: {
      'react-helmet-async': fileURLToPath(
        new URL(
          './node_modules/vite-react-ssg/node_modules/react-helmet-async',
          import.meta.url,
        ),
      ),
      // Route the content layer at the fixed test dataset instead of the real
      // `content/` folder, so the suite stays green regardless of what author
      // content is present. Dev/build still use the real `virtual:content`
      // plugin — this alias applies to tests only.
      'virtual:content': fileURLToPath(
        new URL('./src/test/fixtures.ts', import.meta.url),
      ),
    },
  },
});
