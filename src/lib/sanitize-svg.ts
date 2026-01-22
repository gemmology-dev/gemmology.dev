/**
 * SVG Sanitization utility using DOMPurify
 * Provides defense-in-depth against XSS in SVG content
 */
import DOMPurify from 'dompurify';

// Configure DOMPurify for SVG content
const SVG_CONFIG: DOMPurify.Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  // Allow common SVG elements
  ADD_TAGS: [
    'use',
    'clipPath',
    'linearGradient',
    'radialGradient',
    'stop',
    'defs',
    'mask',
    'pattern',
    'symbol',
    'marker',
    'filter',
    'feGaussianBlur',
    'feOffset',
    'feBlend',
    'feMerge',
    'feMergeNode',
  ],
  // Allow common SVG attributes
  ADD_ATTR: [
    'xlink:href',
    'href',
    'viewBox',
    'preserveAspectRatio',
    'xmlns',
    'xmlns:xlink',
    'clip-path',
    'clip-rule',
    'fill-rule',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-opacity',
    'stroke-width',
    'fill-opacity',
    'font-family',
    'font-size',
    'font-weight',
    'text-anchor',
    'dominant-baseline',
    'alignment-baseline',
    'vector-effect',
    'stop-color',
    'stop-opacity',
    'offset',
    'gradientUnits',
    'gradientTransform',
    'patternUnits',
    'patternTransform',
    'markerUnits',
    'markerWidth',
    'markerHeight',
    'refX',
    'refY',
    'orient',
    'filterUnits',
    'primitiveUnits',
    'stdDeviation',
    'in',
    'in2',
    'result',
    'mode',
  ],
  // Forbid dangerous attributes
  FORBID_ATTR: [
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'onmouseout',
    'onmousedown',
    'onmouseup',
    'onfocus',
    'onblur',
    'onkeydown',
    'onkeyup',
    'onkeypress',
    'onsubmit',
    'onreset',
    'onchange',
    'oninput',
    'onscroll',
    'onwheel',
    'ondrag',
    'ondrop',
    'onanimationstart',
    'onanimationend',
    'ontransitionend',
  ],
  // Forbid script and other dangerous elements
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
};

/**
 * Sanitize SVG content to prevent XSS attacks
 * @param svgContent - Raw SVG string
 * @returns Sanitized SVG string safe for rendering
 */
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent) return '';

  // DOMPurify.sanitize returns a string when not using RETURN_DOM options
  return DOMPurify.sanitize(svgContent, SVG_CONFIG) as string;
}

/**
 * Check if SVG content is valid and sanitize it
 * @param svgContent - Raw SVG string
 * @returns Object with validity flag and sanitized content
 */
export function validateAndSanitizeSvg(
  svgContent: string | undefined | null
): { valid: boolean; sanitized: string } {
  if (!svgContent) {
    return { valid: false, sanitized: '' };
  }

  const hasSvgTags = svgContent.includes('<svg') && svgContent.includes('</svg>');
  if (!hasSvgTags) {
    return { valid: false, sanitized: '' };
  }

  const sanitized = sanitizeSvg(svgContent);
  return { valid: true, sanitized };
}
