/**
 * Regenerate only the problematic OG images
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import {
  readFileSync,
  existsSync,
  mkdirSync,
  statSync,
} from 'fs';
import { join, extname, dirname } from 'path';

const distDir = join(process.cwd(), 'dist');
const PORT = 4173;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function createStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      let filePath = join(dir, urlPath === '/' ? 'index.html' : urlPath);

      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        if (stats.isDirectory()) {
          filePath = join(filePath, 'index.html');
        }
      } else if (!extname(filePath)) {
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
      console.log(`Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function screenshotPage(browser, port, url, output) {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    console.log(`\n📸 ${url}`);

    // Navigate
    await page.goto(`http://localhost:${port}${url}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for fonts (30s for problematic pages)
    await page.waitForFunction(
      () => document.body.hasAttribute('data-fonts-loaded'),
      { timeout: 30000 }
    ).catch(() => {
      console.log(`  ⚠️  Font loading timeout, continuing...`);
    });

    // Wait for sizing (20s for problematic pages)
    await page.waitForFunction(
      () => document.body.hasAttribute('data-og-ready'),
      { timeout: 20000 }
    ).catch(() => {
      console.log(`  ⚠️  OG sizing timeout, continuing...`);
    });

    // Extra wait for SVG rendering
    console.log(`  Waiting 4s for SVG rendering...`);
    await page.waitForTimeout(4000);

    // Ensure output directory exists
    const dir = dirname(output);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Screenshot
    await page.screenshot({
      path: output,
      type: 'jpeg',
      quality: 85,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    console.log(`  ✅ Saved to ${output}`);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  } finally {
    await page.close();
    await context.close();
  }
}

async function main() {
  console.log('Regenerating problematic OG images...\n');

  const server = await createStaticServer(distDir, PORT);
  const browser = await chromium.launch({ headless: true });

  const items = [
    {
      url: '/og/minerals/quartz-(dauphiné-twin)',
      output: join(distDir, 'og-images', 'minerals', 'quartz-(dauphiné-twin).jpg'),
    },
    {
      url: '/og/minerals/staurolite-(60°-cross-twin)',
      output: join(distDir, 'og-images', 'minerals', 'staurolite-(60°-cross-twin).jpg'),
    },
    {
      url: '/og/minerals/staurolite-(90°-cross-twin)',
      output: join(distDir, 'og-images', 'minerals', 'staurolite-(90°-cross-twin).jpg'),
    },
  ];

  for (const item of items) {
    await screenshotPage(browser, PORT, item.url, item.output);
  }

  await browser.close();
  server.close();

  console.log('\n✅ Regeneration complete!');
}

main().catch(console.error);
