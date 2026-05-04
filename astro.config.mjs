import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

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
    sitemap({
      filter: (page) => !page.includes('/admin'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        // Boost priority/lastmod for hub pages and canonical references
        if (item.url === 'https://gemmology.dev/' ||
            item.url === 'https://gemmology.dev/gallery/' ||
            item.url === 'https://gemmology.dev/learn/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (/\/minerals\/[^/]+\/$/.test(item.url)) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (/\/learn\//.test(item.url)) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (/\/docs\//.test(item.url)) {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
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
