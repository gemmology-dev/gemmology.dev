/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // jsdom is used for everything — node-only tests still work under jsdom,
    // and React component tests need it. Slightly slower but uniform.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/lib/quiz/store/**',
        'src/lib/quiz/scheduler.ts',
        'src/lib/quiz/selector.ts',
        'src/lib/quiz/interleaver.ts',
        'src/hooks/useQuiz.ts',
        'src/hooks/useExam.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 90,
        branches: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@lib': resolve(__dirname, './src/lib'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
});
