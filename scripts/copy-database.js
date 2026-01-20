import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const dbSource = join(projectRoot, 'src', 'data', 'minerals.db');
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
  console.log('✓ Copied minerals.db to public/');
} else {
  console.log('⚠ minerals.db not found at', dbSource);
  console.log('  Run: cp ~/gemmology/migration/workspace/mineral-database/src/mineral_database/data/minerals.db src/data/');
}

// Copy sql.js WASM files
const sqlJsFiles = ['sql-wasm.js', 'sql-wasm.wasm'];
for (const file of sqlJsFiles) {
  const source = join(sqlJsSource, file);
  const dest = join(sqlJsDest, file);
  if (existsSync(source)) {
    copyFileSync(source, dest);
    console.log(`✓ Copied ${file} to public/sql.js/`);
  } else {
    console.log(`⚠ ${file} not found. Run npm install first.`);
  }
}

console.log('\nDatabase setup complete!');
