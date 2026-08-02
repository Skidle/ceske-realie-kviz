import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Matches the layout Create React App produced, so the Vercel project needs no changes.
    outDir: 'build',
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [
        // Data, not logic: importing these marks every line covered, which would flatter
        // the number without anything having been tested.
        'src/content/**',
        'src/locale/**',
        'src/**/types.ts',
        'src/main.tsx',
        'src/test/**',
      ],
    },
  },
});
