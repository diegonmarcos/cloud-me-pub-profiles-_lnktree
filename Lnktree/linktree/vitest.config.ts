import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Unit tests only: tests/e2e/ is the Playwright suite, run separately.
    include: ['tests/*.test.ts', 'tests/*.test.mjs'],
  },
});
