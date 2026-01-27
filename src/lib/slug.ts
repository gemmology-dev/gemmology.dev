/**
 * Generate URL-safe slug from mineral name
 * Handles spaces, apostrophes, parentheses, and forward slashes
 * Must match normalize_filename() in scripts/generate-all-assets.py
 */
export function mineralSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/'/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\//g, '-');
}
