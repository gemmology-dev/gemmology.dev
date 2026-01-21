/**
 * Generate URL-safe slug from mineral name
 * Handles spaces, apostrophes, and forward slashes
 */
export function mineralSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/'/g, '')
    .replace(/\//g, '-');
}
