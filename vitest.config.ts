import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    globals: false,

    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.wrangler/**',
    ],

    setupFiles: ['./src/test/setup.ts'],

    clearMocks: true,
    restoreMocks: true,
  },
});