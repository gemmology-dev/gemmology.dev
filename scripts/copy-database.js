import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Use require to resolve the npm package path
const require = createRequire(import.meta.url);

// Prefer local database if it exists (may have newer model data with crystalEdges)
// Fall back to npm package if local doesn't exist
let dbSource;
const localDbPath = join(projectRoot, 'src', 'data', 'minerals.db');

if (existsSync(localDbPath)) {
  dbSource = localDbPath;
  console.log('Using local src/data/minerals.db (preferred for latest model data)');
} else {
  try {
    const mineralData = require('@gemmology/mineral-data');
    dbSource = mineralData.dbPath;
    console.log('Using @gemmology/mineral-data package');
  } catch (e) {
    console.error('Error: No local database and @gemmology/mineral-data not installed');
    process.exit(1);
  }
}

const dbDest = join(projectRoot, 'public', 'minerals.db');

// Also copy sql.js WASM files
const sqlJsSource = join(projectRoot, 'node_modules', 'sql.js', 'dist');
const sqlJsDest = join(projectRoot, 'public', 'sql.js');

// Ensure directories exist
mkdirSync(join(projectRoot, 'public'), { recursive: true });
mkdirSync(sqlJsDest, { recursive: true });

// Copy database if it exists
if (existsSync(dbSource)) {
  copyFileSync(dbSource, dbDest);
  console.log('Copied minerals.db to public/');
} else {
  console.log('minerals.db not found at', dbSource);
  console.log('  Install @gemmology/mineral-data or copy manually to src/data/');
}

// Copy sql.js WASM files
const sqlJsFiles = ['sql-wasm.js', 'sql-wasm.wasm'];
for (const file of sqlJsFiles) {
  const source = join(sqlJsSource, file);
  const dest = join(sqlJsDest, file);
  if (existsSync(source)) {
    copyFileSync(source, dest);
    console.log(`Copied ${file} to public/sql.js/`);
  } else {
    console.log(`${file} not found. Run npm install first.`);
  }
}

console.log('\nDatabase setup complete!');
