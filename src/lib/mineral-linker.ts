/**
 * Auto-link mineral names in text content
 * Converts mineral names to links to /minerals/{id} pages
 */
import { getAllMinerals } from './db-server';

interface MineralLink {
  name: string;
  id: string;
  pattern: RegExp;
}

let mineralLinks: MineralLink[] | null = null;

/**
 * Initialize mineral links from database
 * Called once at build time, cached for subsequent calls
 */
export async function initMineralLinks(): Promise<MineralLink[]> {
  if (mineralLinks) return mineralLinks;

  const minerals = await getAllMinerals();

  // Create links sorted by name length (longest first) to match longer names first
  // e.g., "Red Beryl" before "Beryl"
  mineralLinks = minerals
    .map(m => ({
      name: m.name,
      id: m.id, // Use mineral.id (preset ID) for URL
      // Word boundary match, case insensitive
      // Negative lookbehind for [ to avoid matching already-linked text
      // Negative lookahead for ] to avoid matching link text
      pattern: new RegExp(
        `(?<!\\[)\\b(${escapeRegex(m.name)})\\b(?!\\])(?![^<]*>)`,
        'gi'
      ),
    }))
    .sort((a, b) => b.name.length - a.name.length);

  return mineralLinks;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Process HTML content and add mineral links
 * Avoids linking:
 * - Already linked text (inside <a> tags)
 * - Text inside HTML tags
 * - The same mineral more than once per section
 */
export async function addMineralLinks(html: string): Promise<string> {
  const links = await initMineralLinks();
  const linkedMinerals = new Set<string>();

  let result = html;

  for (const mineral of links) {
    // Skip if we've already linked this mineral
    const lowerName = mineral.name.toLowerCase();
    if (linkedMinerals.has(lowerName)) continue;

    // Check if the mineral name exists in the content
    if (!mineral.pattern.test(result)) continue;

    // Reset the regex lastIndex
    mineral.pattern.lastIndex = 0;

    // Replace only the first occurrence
    let replaced = false;
    result = result.replace(mineral.pattern, (match) => {
      if (replaced) return match;

      // Check if we're inside an HTML tag or anchor
      const beforeMatch = result.substring(0, result.indexOf(match));
      const openTags = (beforeMatch.match(/<a\b[^>]*>/gi) || []).length;
      const closeTags = (beforeMatch.match(/<\/a>/gi) || []).length;

      // If we're inside an anchor tag, don't replace
      if (openTags > closeTags) return match;

      replaced = true;
      linkedMinerals.add(lowerName);
      return `<a href="/minerals/${mineral.id}" class="mineral-link">${match}</a>`;
    });
  }

  return result;
}

/**
 * Get list of mineral names for reference
 */
export async function getMineralNames(): Promise<string[]> {
  const links = await initMineralLinks();
  return links.map(l => l.name);
}
