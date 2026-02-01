import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const distDir = join(process.cwd(), 'dist');
const PORT = 4173;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.woff2': 'font/woff2',
};

function createStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
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

    server.listen(port, () => resolve(server));
  });
}

async function debugPage(url) {
  const server = await createStaticServer(distDir, PORT);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => console.log(`📝 ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`❌ JS Error: ${error.message}`));
  page.on('requestfailed', request => console.error(`❌ Request failed: ${request.url()}`));
  page.on('response', response => {
    if (response.status() === 404) {
      console.error(`❌ 404 Not Found: ${response.url()}`);
    }
  });

  console.log(`\n🔍 Debugging: ${url}\n`);

  await page.goto(`http://localhost:${PORT}${url}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Check attributes
  await page.waitForTimeout(5000);

  const hasFontsLoaded = await page.evaluate(() =>
    document.body.hasAttribute('data-fonts-loaded')
  );
  const hasOgReady = await page.evaluate(() =>
    document.body.hasAttribute('data-og-ready')
  );
  const svgCount = await page.evaluate(() =>
    document.querySelectorAll('.crystal-svg svg').length
  );

  console.log(`\n📊 Status:`);
  console.log(`  Fonts loaded attribute: ${hasFontsLoaded}`);
  console.log(`  OG ready attribute: ${hasOgReady}`);
  console.log(`  SVG elements found: ${svgCount}`);

  await browser.close();
  server.close();
  console.log('\n✅ Debug complete');
}

debugPage('/og/minerals/quartz-(dauphiné-twin)').catch(console.error);
