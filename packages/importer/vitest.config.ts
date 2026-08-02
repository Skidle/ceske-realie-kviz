import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      // Type declarations emit no runtime code, so counting them only inflates the number.
      exclude: ['src/types.ts'],
    },
  },
});
