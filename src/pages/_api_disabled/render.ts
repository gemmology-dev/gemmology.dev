import type { APIRoute } from 'astro';

// Pre-defined preset SVGs for common crystal forms (fallback when packages unavailable)
const PRESET_SVGS: Record<string, string> = {
  'cubic[m3m]:{111}': 'octahedron',
  'cubic[m3m]:{100}': 'cube',
  'cubic[m3m]:{110}': 'dodecahedron',
  'cubic[m3m]:{111}@1.0 + {100}@1.3': 'truncated-octahedron',
};

function generatePlaceholderSVG(cdl: string, elev: number = 30, azim: number = -45): string {
  // Extract system name from CDL for the label
  const systemMatch = cdl.match(/^(\w+)/);
  const system = systemMatch ? systemMatch[1] : 'crystal';

  // Simple rotation transforms based on angles
  const rotX = Math.cos((elev * Math.PI) / 180);
  const rotY = Math.sin((azim * Math.PI) / 180);

  // Generate slightly different shapes based on system
  let points: string;
  const scale = 80;

  if (cdl.includes('{100}') && !cdl.includes('{111}')) {
    // Cube-like
    const s = scale * 0.7;
    points = `${-s},${-s * 0.5} ${s},${-s * 0.5} ${s * 1.2},${s * 0.3} ${-s * 0.8},${s * 0.3}`;
  } else if (cdl.includes('{110}') && !cdl.includes('{111}')) {
    // Dodecahedron-like
    points = `0,${-scale} ${-scale * 0.7},${-scale * 0.3} ${-scale * 0.7},${scale * 0.3} 0,${scale} ${scale * 0.7},${scale * 0.3} ${scale * 0.7},${-scale * 0.3}`;
  } else {
    // Default octahedron
    points = `0,${-scale} ${-scale * 0.8},0 0,${scale} ${scale * 0.8},0`;
  }

  return `<svg viewBox="-150 -150 300 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="face1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:0.9" />
    </linearGradient>
    <linearGradient id="face2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.7" />
      <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <g transform="rotate(${azim * 0.5})">
    <polygon points="0,-100 -80,0 0,100" fill="url(#face2)" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
    <polygon points="0,-100 0,100 80,0" fill="url(#face1)" stroke="#0369a1" stroke-width="1.5" opacity="0.7"/>
    <polygon points="0,-100 -80,0 80,0" fill="url(#face1)" stroke="#0369a1" stroke-width="2"/>
    <polygon points="0,100 -80,0 80,0" fill="url(#face2)" stroke="#0369a1" stroke-width="2"/>
  </g>
  <text x="0" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">${system}</text>
</svg>`;
}

function validateCDL(cdl: string): { valid: boolean; error?: string } {
  // Basic CDL validation
  const cdlPattern = /^(cubic|hexagonal|trigonal|tetragonal|orthorhombic|monoclinic|triclinic)\[[\w\-\/]+\]:\{[\d\-]+\}/;

  if (!cdl || typeof cdl !== 'string') {
    return { valid: false, error: 'CDL expression is required' };
  }

  const trimmed = cdl.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'CDL expression cannot be empty' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'CDL expression too long' };
  }

  if (!cdlPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid CDL syntax' };
  }

  return { valid: true };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { cdl, elev = 30, azim = -45 } = body;

    // Validate input
    const validation = validateCDL(cdl);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate angle ranges
    const elevation = Math.max(-90, Math.min(90, Number(elev) || 30));
    const azimuth = Math.max(-180, Math.min(180, Number(azim) || -45));

    // Try to generate SVG using gemmology packages (if available)
    let svg: string;

    try {
      // This would be the real implementation with Python packages
      // For now, use placeholder generation
      // In production, you would call a Python subprocess or use WASM
      svg = generatePlaceholderSVG(cdl, elevation, azimuth);
    } catch (renderError) {
      // Fallback to placeholder
      svg = generatePlaceholderSVG(cdl, elevation, azimuth);
    }

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Render API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Also support GET for simple testing
export const GET: APIRoute = async ({ url }) => {
  const cdl = url.searchParams.get('cdl');
  const elev = url.searchParams.get('elev');
  const azim = url.searchParams.get('azim');

  if (!cdl) {
    return new Response(JSON.stringify({ error: 'CDL parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validation = validateCDL(cdl);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const elevation = Math.max(-90, Math.min(90, Number(elev) || 30));
  const azimuth = Math.max(-180, Math.min(180, Number(azim) || -45));

  const svg = generatePlaceholderSVG(cdl, elevation, azimuth);

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
