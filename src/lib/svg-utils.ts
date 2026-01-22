/**
 * SVG utility functions for cleaning and processing crystal SVGs
 * Includes security sanitization for server-side rendering
 */

/**
 * Security-focused SVG sanitization (works server-side without DOM)
 * Removes potentially dangerous elements and attributes
 */
export function secureSanitizeSvg(svgContent: string): string {
  if (!svgContent) return '';

  let cleaned = svgContent;

  // Remove script tags and their content
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*\/>/gi, '');

  // Remove style tags (can contain CSS expressions)
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove dangerous elements
  const dangerousElements = [
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'option',
    'foreignObject',
  ];
  dangerousElements.forEach((tag) => {
    const openClose = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfClose = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    cleaned = cleaned.replace(openClose, '');
    cleaned = cleaned.replace(selfClose, '');
  });

  // Remove event handlers (on* attributes)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
  cleaned = cleaned.replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, 'xlink:href=""');

  // Remove data: URLs that could contain scripts (allow image data URIs)
  cleaned = cleaned.replace(
    /href\s*=\s*["']data:(?!image\/)[^"']*["']/gi,
    'href=""'
  );
  cleaned = cleaned.replace(
    /xlink:href\s*=\s*["']data:(?!image\/)[^"']*["']/gi,
    'xlink:href=""'
  );

  // Remove set attribute (can be used to set event handlers)
  cleaned = cleaned.replace(/<set[\s\S]*?<\/set>/gi, '');
  cleaned = cleaned.replace(/<set[^>]*\/>/gi, '');

  // Remove animate elements that could trigger events
  // Keep safe animation but remove onbegin, onend, onrepeat handlers
  cleaned = cleaned.replace(/\s+onbegin\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+onend\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+onrepeat\s*=\s*["'][^"']*["']/gi, '');

  return cleaned;
}

/**
 * Clean a Matplotlib-generated SVG by removing axes, grids, and backgrounds
 * Also applies security sanitization
 * Keeps only the crystal geometry (Poly3DCollection elements)
 */
export function cleanCrystalSvg(svgContent: string): string {
  if (!svgContent) return '';

  // First apply security sanitization
  let cleaned = secureSanitizeSvg(svgContent);

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

  // Remove use elements that reference the unwanted IDs
  elementsToRemove.forEach((pattern) => {
    // Remove <use> elements referencing these IDs
    const usePattern = new RegExp(
      `<use[^>]*xlink:href="${pattern.source.replace(/\\d\+/, '\\d+')}"[^>]*/>`,
      'g'
    );
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

  groupPatterns.forEach((pattern) => {
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
