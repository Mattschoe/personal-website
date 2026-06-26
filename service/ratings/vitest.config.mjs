import { defineConfig } from 'vitest/config';

// Self-contained config so the service test run doesn't walk up and inherit the
// frontend's root config (React plugin, jsdom, virtual:content, setupTests).
// This is a plain Node service — node environment, no setup, no plugins.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['*.test.mjs'],
  },
});
