import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { contentPlugin } from './vite-plugin-content';

// https://vite.dev/config/ — Vitest config is merged in via vitest/config's defineConfig.
export default defineConfig({
  // contentPlugin parses content/ at build time into the `virtual:content` module.
  plugins: [react(), contentPlugin()],
  // vite-react-ssg reads ssgOptions during `vite-react-ssg build`.
  ssgOptions: {
    // Defaults are fine for the scaffold; routes come from src/routes.tsx.
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
