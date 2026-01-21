import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
// Sitemap temporarily disabled due to build error
// import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gemmology.dev',
  output: 'static', // Static output - API routes will be serverless functions or disabled
  integrations: [
    expressiveCode({
      themes: ['one-dark-pro'],
      styleOverrides: {
        borderRadius: '0.75rem',
        codePaddingBlock: '1rem',
        codePaddingInline: '1.25rem',
        frames: {
          frameBoxShadowCssValue: 'none',
        },
      },
    }),
    react(),
    tailwind(),
    // sitemap(), // Temporarily disabled - see https://github.com/withastro/astro/issues
  ],
  vite: {
    optimizeDeps: {
      exclude: ['sql.js'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            monaco: ['monaco-editor', '@monaco-editor/react'],
            sqljs: ['sql.js'],
          },
        },
      },
    },
  },
});
