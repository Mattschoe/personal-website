import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/ — Vitest config is merged in via vitest/config's defineConfig.
export default defineConfig({
  plugins: [react()],
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
