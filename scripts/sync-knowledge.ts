#!/usr/bin/env tsx
/**
 * Sync script to pull content from gemmology-knowledge repository
 * and copy learn content to src/content/learn/
 */

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, utimesSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { KNOWLEDGE_VERSION } from '../src/lib/knowledge-version.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const CACHE_DIR = join(ROOT_DIR, '.cache');
const KNOWLEDGE_REPO = 'https://github.com/gemmology-dev/gemmology-knowledge.git';
const KNOWLEDGE_DIR = join(CACHE_DIR, 'gemmology-knowledge');
const CONTENT_SOURCE = join(KNOWLEDGE_DIR, 'docs', 'learn');
const CONTENT_DEST = join(ROOT_DIR, 'src', 'content', 'learn');

// Check if we're in a monorepo/workspace with local gemmology-knowledge
const LOCAL_KNOWLEDGE_DIR = resolve(ROOT_DIR, '..', 'gemmology-knowledge');

function log(message: string) {
  console.log(`[sync-knowledge] ${message}`);
}

function error(message: string) {
  console.error(`[sync-knowledge] ERROR: ${message}`);
}

/**
 * Recursively copy YAML files from source to destination,
 * preserving subdirectory structure (e.g., equipment/, species/, origin/)
 */
/**
 * Stamp dest with the source file's last git-commit timestamp so the build can
 * surface a meaningful "Last updated" date instead of the sync wall-clock time.
 * Falls back silently if the file is not tracked or git isn't available.
 */
function stampGitMtime(sourcePath: string, destPath: string, repoRoot: string): void {
  try {
    const isoStamp = execSync(`git log -1 --format=%cI -- "${sourcePath}"`, {
      cwd: repoRoot,
      encoding: 'utf-8',
    }).trim();
    if (!isoStamp) return;
    const ts = new Date(isoStamp);
    if (Number.isNaN(ts.getTime())) return;
    utimesSync(destPath, ts, ts);
  } catch {
    // ignore — leaves cpSync's default mtime in place
  }
}

function copyYamlFilesRecursive(sourceDir: string, destDir: string, relativePath: string = '', repoRoot?: string): number {
  let count = 0;
  const currentSource = join(sourceDir, relativePath);
  const currentDest = join(destDir, relativePath);

  if (!existsSync(currentSource)) {
    return 0;
  }

  const entries = readdirSync(currentSource);

  for (const entry of entries) {
    const sourcePath = join(currentSource, entry);
    const destPath = join(currentDest, entry);
    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      count += copyYamlFilesRecursive(sourceDir, destDir, join(relativePath, entry), repoRoot);
    } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
      // Copy YAML file
      if (!existsSync(currentDest)) {
        mkdirSync(currentDest, { recursive: true });
      }
      cpSync(sourcePath, destPath);
      if (repoRoot) {
        stampGitMtime(sourcePath, destPath, repoRoot);
      }
      const displayPath = relativePath ? `${relativePath}/${entry}` : entry;
      log(`  Copied: ${displayPath}`);
      count++;
    }
  }

  return count;
}

function syncFromLocal(): boolean {
  const localSource = join(LOCAL_KNOWLEDGE_DIR, 'docs', 'learn');

  if (!existsSync(localSource)) {
    return false;
  }

  log(`Found local gemmology-knowledge at ${LOCAL_KNOWLEDGE_DIR}`);
  log(`Syncing from local: ${localSource}`);

  // Ensure destination directory exists
  if (!existsSync(CONTENT_DEST)) {
    mkdirSync(CONTENT_DEST, { recursive: true });
  }

  // Copy YAML files recursively (handles flat files and subdirectories)
  const fileCount = copyYamlFilesRecursive(localSource, CONTENT_DEST, '', LOCAL_KNOWLEDGE_DIR);

  if (fileCount === 0) {
    log('No YAML files found in local source');
    return false;
  }

  log(`Synced ${fileCount} files from local gemmology-knowledge`);
  return true;
}

function syncFromGit(): boolean {
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  try {
    if (existsSync(KNOWLEDGE_DIR)) {
      log(`Fetching gemmology-knowledge tag ${KNOWLEDGE_VERSION}...`);
      execSync('git fetch --tags --force origin', {
        cwd: KNOWLEDGE_DIR,
        stdio: 'inherit',
      });
    } else {
      log('Cloning gemmology-knowledge repository...');
      execSync(`git clone ${KNOWLEDGE_REPO} ${KNOWLEDGE_DIR}`, {
        stdio: 'inherit',
      });
    }
    log(`Checking out ${KNOWLEDGE_VERSION}...`);
    execSync(`git checkout --detach tags/${KNOWLEDGE_VERSION}`, {
      cwd: KNOWLEDGE_DIR,
      stdio: 'inherit',
    });
  } catch (err) {
    error(`Failed to sync git repository at tag ${KNOWLEDGE_VERSION}`);
    return false;
  }

  // Check if source directory exists
  if (!existsSync(CONTENT_SOURCE)) {
    log('No learn content found in gemmology-knowledge yet');
    return false;
  }

  // Ensure destination directory exists
  if (!existsSync(CONTENT_DEST)) {
    mkdirSync(CONTENT_DEST, { recursive: true });
  }

  // Copy YAML files recursively (handles flat files and subdirectories)
  const fileCount = copyYamlFilesRecursive(CONTENT_SOURCE, CONTENT_DEST, '', KNOWLEDGE_DIR);

  if (fileCount === 0) {
    log('No YAML files found in source');
    return false;
  }

  log(`Synced ${fileCount} files from gemmology-knowledge`);
  return true;
}

function main() {
  log('Starting content sync...');

  // Clear existing synced content
  if (existsSync(CONTENT_DEST)) {
    rmSync(CONTENT_DEST, { recursive: true });
    log('Cleared existing synced content');
  }

  // Try local first (for development in monorepo)
  if (syncFromLocal()) {
    log('Sync complete (local)');
    return;
  }

  // Fall back to git clone/pull
  if (syncFromGit()) {
    log('Sync complete (git)');
    return;
  }

  // No content available - create empty directory
  log('No learn content available yet - creating empty directory');
  mkdirSync(CONTENT_DEST, { recursive: true });
}

main();
