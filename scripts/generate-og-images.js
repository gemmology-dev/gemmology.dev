/**
 * Generate OG Images from HTML templates
 *
 * Usage: node scripts/generate-og-images.js
 *
 * Requires: npm install playwright (dev dependency)
 *
 * This script:
 * 1. Scans dist/og/ directory for template pages
 * 2. Starts a local server with the built site
 * 3. Batch screenshots pages using Playwright (4 concurrent contexts)
 * 4. Saves images to dist/og-images/ directory
 * 5. Comprehensive error handling with retries
 * 6. Exits with code 1 if any images fail
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  statSync,
  readdirSync,
} from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const CONCURRENT = Math.min(4, os.cpus().length); // CPU-aware concurrency
const RETRIES = 3;
const PORT = 4173;

// Track results
const errors = [];
let successCount = 0;

// MIME types for static serving
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

/**
 * Create a simple static file server
 */
function createStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      // Parse URL and remove query strings
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
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

/**
 * Get list of directory slugs from a path (flat, non-recursive)
 */
function getDirectorySlugs(dir) {
  if (!existsSync(dir)) {
    console.warn(`  Warning: Directory not found: ${dir}`);
    return [];
  }

  return readdirSync(dir).filter((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory();
  });
}

/**
 * Recursively find all directories containing index.html
 * Returns paths relative to the base directory
 */
function getNestedPagePaths(baseDir) {
  if (!existsSync(baseDir)) {
    console.warn(`  Warning: Directory not found: ${baseDir}`);
    return [];
  }

  const results = [];

  function scan(dir, relativePath = '') {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relativePath ? `${relativePath}/${entry}` : entry;

      if (statSync(fullPath).isDirectory()) {
        // Check if this directory has index.html
        const indexPath = join(fullPath, 'index.html');
        if (existsSync(indexPath)) {
          results.push(relPath);
        }
        // Recurse into subdirectories
        scan(fullPath, relPath);
      }
    }
  }

  scan(baseDir);
  return results;
}

/**
 * Screenshot a single page with retries
 */
async function screenshotWithContext(context, port, url, output, attempt = 1) {
  const page = await context.newPage();

  try {
    // Detect problematic URLs with special characters or complex twins
    const isProblematic = url.includes('dauphiné') ||
                          url.includes('°') ||
                          url.includes('staurolite');

    // Use longer timeouts for problematic pages
    const fontTimeout = isProblematic ? 30000 : 15000;
    const sizingTimeout = isProblematic ? 20000 : 8000;
    const renderWait = isProblematic ? 2000 : 800;

    // Navigate with timeout
    await page.goto(`http://localhost:${port}${url}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for fonts to load (check for data-fonts-loaded attribute)
    let fontTimedOut = false;
    await page.waitForFunction(
      () => {
        return document.body.hasAttribute('data-fonts-loaded');
      },
      { timeout: fontTimeout }
    ).catch(() => {
      // Font loading can timeout, continue anyway
      fontTimedOut = true;
      console.log(`  ⚠️  Font loading timeout for ${url}, continuing...`);
    });

    // Wait for the sizing script to complete (indicated by data-og-ready attribute)
    let sizingTimedOut = false;
    await page.waitForFunction(
      () => {
        return document.body.hasAttribute('data-og-ready');
      },
      { timeout: sizingTimeout }
    ).catch(() => {
      sizingTimedOut = true;
      console.log(`  ⚠️  OG sizing timeout for ${url}, continuing...`);
    });

    // Additional wait for rendering (longer for complex SVGs and timeouts)
    const extraWait = (fontTimedOut || sizingTimedOut) ? renderWait * 2 : renderWait;
    await page.waitForTimeout(extraWait);

    // Ensure output directory exists
    const dir = dirname(output);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Take screenshot
    await page.screenshot({
      path: output,
      type: 'jpeg',
      quality: 85,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    await page.close();
    successCount++;
  } catch (error) {
    await page.close();

    console.error(`  ⚠️  Attempt ${attempt}/${RETRIES} failed for ${url}:`);
    console.error(`      ${error.message}`);

    if (attempt < RETRIES) {
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return screenshotWithContext(context, port, url, output, attempt + 1);
    } else {
      errors.push({
        url,
        output,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

/**
 * Batch screenshot multiple pages with concurrent contexts
 */
async function batchScreenshot(browser, port, items, label) {
  console.log(`\n${label}`);
  console.log(`Processing ${items.length} pages...`);

  if (items.length === 0) {
    console.log('  No pages to process');
    return;
  }

  for (let i = 0; i < items.length; i += CONCURRENT) {
    const batch = items.slice(i, i + CONCURRENT);

    // Create contexts for this batch
    const contexts = await Promise.all(
      batch.map(() =>
        browser.newContext({
          viewport: { width: 1200, height: 630 },
          deviceScaleFactor: 2, // 2x for retina quality
        })
      )
    );

    // Process batch in parallel
    await Promise.allSettled(
      batch.map((item, idx) =>
        screenshotWithContext(contexts[idx], port, item.url, item.output)
      )
    );

    // Clean up contexts
    await Promise.all(contexts.map((ctx) => ctx.close()));

    // Progress update
    const processed = Math.min(i + CONCURRENT, items.length);
    console.log(`  Progress: ${processed}/${items.length}`);
  }
}

/**
 * Main generation function
 */
async function generateAllOGImages() {
  console.log('\n===========================================');
  console.log('  OG Image Generation');
  console.log('===========================================\n');
  console.log(`Using ${CONCURRENT} concurrent browser contexts`);

  // Check if dist folder exists
  if (!existsSync(distDir)) {
    console.error('❌ Error: dist/ directory not found.');
    console.error('   Run "npm run build" first to generate the site.');
    process.exit(1);
  }

  // Start local server
  console.log(`\nStarting static server on port ${PORT}...`);
  const server = await createStaticServer(distDir, PORT);

  // Launch browser
  console.log('Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    // Prepare batch lists
    const mineralSlugs = getDirectorySlugs(join(distDir, 'og', 'minerals'));
    const learnPaths = getNestedPagePaths(join(distDir, 'og', 'learn'));

    const mineralItems = mineralSlugs.map((slug) => ({
      url: `/og/minerals/${slug}`,
      output: join(distDir, 'og-images', 'minerals', `${slug}.jpg`),
    }));

    const learnItems = learnPaths.map((path) => ({
      url: `/og/learn/${path}`,
      output: join(distDir, 'og-images', 'learn', `${path}.jpg`),
    }));

    // Generate mineral OG images
    await batchScreenshot(
      browser,
      PORT,
      mineralItems,
      `📦 Mineral OG Images (${mineralItems.length} pages)`
    );

    // Generate learn OG images
    await batchScreenshot(
      browser,
      PORT,
      learnItems,
      `📚 Learn OG Images (${learnItems.length} pages)`
    );

    // Generate default OG image if template exists
    const defaultTemplatePath = join(distDir, 'og-image', 'index.html');
    if (existsSync(defaultTemplatePath)) {
      console.log('\n🌐 Default OG Image');
      const context = await browser.newContext({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 2,
      });

      await screenshotWithContext(
        context,
        PORT,
        '/og-image',
        join(distDir, 'og-images', 'default.jpg')
      );

      await context.close();
      console.log('  ✅ Default image generated');
    }

    // Summary
    console.log('\n===========================================');
    console.log(`✅ Successfully generated ${successCount} OG images`);

    if (errors.length > 0) {
      console.error(`\n❌ Failed to generate ${errors.length} images:`);
      errors.forEach((err) => {
        console.error(`   - ${err.url}`);
        console.error(`     ${err.error}`);
      });

      // Write error log
      const errorLogPath = join(distDir, 'og-generation-errors.json');
      writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
      console.error(`\n📝 Error log saved to: ${errorLogPath}`);
      console.log('\n===========================================\n');

      process.exit(1);
    }

    console.log('===========================================\n');
  } catch (error) {
    console.error('\n❌ Fatal error during OG generation:');
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

// Run the script
generateAllOGImages().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
