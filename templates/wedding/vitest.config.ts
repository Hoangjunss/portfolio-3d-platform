import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Next requires tsconfig "jsx": "preserve", which leaves JSX untransformed, so oxc must be told
  // the runtime explicitly or every .tsx test fails to parse. template-kit does not need this
  // because it sets "jsx": "react-jsx"; copy this file from templates/event/, not from the kit.
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  // @portfolio/template-kit is a file: dependency, so npm symlinks it and it carries its own copy
  // of React. Without dedupe the kit's hooks run against that copy while the test renders with
  // this package's copy, and every hook call throws "Invalid hook call". The Next build does not
  // hit this because tsconfig paths resolves the kit to its source inside this package's graph.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    // scripts/build-gate.test.mjs drives a real `npm run build` (~16s) and belongs to node --test,
    // not to the unit runner, whose 5s default timeout it cannot meet. `npm test` runs both.
    exclude: ['node_modules/**', 'scripts/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['@testing-library/jest-dom/vitest'],
  },
});
