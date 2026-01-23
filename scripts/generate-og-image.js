/**
 * Generate OG Image from HTML template
 *
 * Usage: node scripts/generate-og-image.js
 *
 * Requires: npm install playwright (dev dependency)
 *
 * This script:
 * 1. Starts a local server with the built site
 * 2. Screenshots the /og-image page at 1200x630
 * 3. Saves as public/og-default.jpg
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const publicDir = join(__dirname, '..', 'public');

// MIME types for static serving
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Simple static file server
function createStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      // Parse URL and remove query strings
      const urlPath = req.url.split('?')[0];
      let filePath = join(dir, urlPath === '/' ? 'index.html' : urlPath);

      // Handle clean URLs (Astro default) - check if it's a directory
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        if (stats.isDirectory()) {
          filePath = join(filePath, 'index.html');
        }
      } else if (!extname(filePath)) {
        // Try adding index.html for clean URLs
        filePath = join(filePath, 'index.html');
      }

      if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
        const ext = extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`Static server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function generateOGImage() {
  console.log('Generating OG image...\n');

  // Check if dist folder exists
  if (!existsSync(join(distDir, 'og-image', 'index.html'))) {
    console.error('Error: dist/og-image/index.html not found.');
    console.error('Run "npm run build" first to generate the OG image template.');
    process.exit(1);
  }

  // Start local server
  const port = 4173;
  const server = await createStaticServer(distDir, port);

  try {
    // Launch browser
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 2, // 2x for retina quality
    });
    const page = await context.newPage();

    // Navigate to OG image page
    await page.goto(`http://localhost:${port}/og-image/`, {
      waitUntil: 'networkidle',
    });

    // Wait for fonts to load
    await page.waitForTimeout(1000);

    // Take screenshot
    const screenshotPath = join(publicDir, 'og-default.jpg');
    await page.screenshot({
      path: screenshotPath,
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    console.log(`✓ OG image saved to: public/og-default.jpg`);

    // Also save PNG version for higher quality if needed
    const pngPath = join(publicDir, 'og-default.png');
    await page.screenshot({
      path: pngPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    console.log(`✓ PNG version saved to: public/og-default.png`);

    await browser.close();
  } finally {
    server.close();
  }

  console.log('\nDone!');
}

generateOGImage().catch(console.error);
