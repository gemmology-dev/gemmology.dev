/**
 * SVG utility functions for cleaning and processing crystal SVGs
 */

/**
 * Clean a Matplotlib-generated SVG by removing axes, grids, and backgrounds
 * Keeps only the crystal geometry (Poly3DCollection elements)
 */
export function cleanCrystalSvg(svgContent: string): string {
  if (!svgContent) return '';

  // Elements to remove (Matplotlib-generated cruft)
  const elementsToRemove = [
    // Background patches and panes
    /#patch_\d+/g,
    /#pane3d_\d+/g,
    // Grid lines
    /#grid3d_\d+/g,
    /#Line3DCollection_\d+/g,
    // Axes and ticks
    /#axis3d_\d+/g,
    /#xtick_\d+/g,
    /#ytick_\d+/g,
    /#ztick_\d+/g,
    /#line2d_\d+/g,
    // Text labels
    /#text_\d+/g,
  ];

  // Parse and clean the SVG
  let cleaned = svgContent;

  // Remove use elements that reference the unwanted IDs
  elementsToRemove.forEach(pattern => {
    // Remove <use> elements referencing these IDs
    const usePattern = new RegExp(`<use[^>]*xlink:href="${pattern.source.replace(/\\d\+/, '\\d+')}"[^>]*/>`, 'g');
    cleaned = cleaned.replace(usePattern, '');
  });

  // Remove the actual group elements with these IDs
  const groupPatterns = [
    /<g id="patch_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="pane3d_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="grid3d_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="Line3DCollection_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="axis3d_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="xtick_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="ytick_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="ztick_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="line2d_\d+"[^>]*>[\s\S]*?<\/g>/g,
    /<g id="text_\d+"[^>]*>[\s\S]*?<\/g>/g,
  ];

  groupPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove path elements with white fill (background)
  cleaned = cleaned.replace(/<path[^>]*style="[^"]*fill:\s*#ffffff[^"]*"[^>]*\/>/gi, '');
  cleaned = cleaned.replace(/<path[^>]*fill="#ffffff"[^>]*\/>/gi, '');

  // Remove clipPath definitions for axes (they reference removed elements)
  cleaned = cleaned.replace(/<clipPath id="p[a-f0-9]+">[\s\S]*?<\/clipPath>/g, '');

  // Clean up empty defs sections
  cleaned = cleaned.replace(/<defs>\s*<\/defs>/g, '');

  // Remove XML declaration and DOCTYPE for inline use
  cleaned = cleaned.replace(/<\?xml[^>]*\?>/g, '');
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/g, '');

  return cleaned.trim();
}

/**
 * Check if SVG content is valid and non-empty
 */
export function isValidSvg(svgContent: string | undefined | null): boolean {
  if (!svgContent) return false;
  return svgContent.includes('<svg') && svgContent.includes('</svg>');
}
