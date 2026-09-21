import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { dedupe: ['react', 'react-dom'] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['@testing-library/jest-dom/vitest'],
  },
});
