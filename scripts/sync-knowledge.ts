#!/usr/bin/env tsx
/**
 * Sync script to pull content from gemmology-knowledge repository
 * and copy learn content to src/content/learn/
 */

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  // Copy YAML files
  const files = readdirSync(localSource).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  if (files.length === 0) {
    log('No YAML files found in local source');
    return false;
  }

  for (const file of files) {
    cpSync(join(localSource, file), join(CONTENT_DEST, file));
    log(`  Copied: ${file}`);
  }

  log(`Synced ${files.length} files from local gemmology-knowledge`);
  return true;
}

function syncFromGit(): boolean {
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  try {
    if (existsSync(KNOWLEDGE_DIR)) {
      log('Pulling latest from gemmology-knowledge...');
      execSync('git pull origin main', {
        cwd: KNOWLEDGE_DIR,
        stdio: 'inherit',
      });
    } else {
      log('Cloning gemmology-knowledge repository...');
      execSync(`git clone ${KNOWLEDGE_REPO} ${KNOWLEDGE_DIR}`, {
        stdio: 'inherit',
      });
    }
  } catch (err) {
    error('Failed to sync git repository');
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

  // Copy YAML files
  const files = readdirSync(CONTENT_SOURCE).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  if (files.length === 0) {
    log('No YAML files found in source');
    return false;
  }

  for (const file of files) {
    cpSync(join(CONTENT_SOURCE, file), join(CONTENT_DEST, file));
    log(`  Copied: ${file}`);
  }

  log(`Synced ${files.length} files from gemmology-knowledge`);
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
