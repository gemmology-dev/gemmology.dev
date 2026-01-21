import type { APIRoute } from 'astro';

function validateCDL(cdl: string): { valid: boolean; error?: string } {
  const cdlPattern = /^(cubic|hexagonal|trigonal|tetragonal|orthorhombic|monoclinic|triclinic)\[[\w\-\/]+\]:\{[\d\-]+\}/;

  if (!cdl || typeof cdl !== 'string') {
    return { valid: false, error: 'CDL expression is required' };
  }

  const trimmed = cdl.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'CDL expression cannot be empty' };
  }

  if (!cdlPattern.test(trimmed)) {
    return { valid: false, error: 'Invalid CDL syntax' };
  }

  return { valid: true };
}

function generatePlaceholderSTL(cdl: string, scale: number = 10): string {
  // Generate a simple ASCII STL for an octahedron
  // In production, this would use crystal-geometry and crystal-renderer packages

  const s = scale;

  // Octahedron vertices
  const vertices = [
    [0, 0, s],    // top
    [s, 0, 0],    // right
    [0, s, 0],    // front
    [-s, 0, 0],   // left
    [0, -s, 0],   // back
    [0, 0, -s],   // bottom
  ];

  // Octahedron faces (8 triangular faces)
  const faces = [
    // Top 4 faces
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 1],
    // Bottom 4 faces
    [5, 2, 1],
    [5, 3, 2],
    [5, 4, 3],
    [5, 1, 4],
  ];

  // Calculate face normals
  function calculateNormal(v0: number[], v1: number[], v2: number[]): number[] {
    const u = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    const v = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const len = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
    return [n[0] / len, n[1] / len, n[2] / len];
  }

  let stl = `solid crystal\n`;

  for (const [i0, i1, i2] of faces) {
    const v0 = vertices[i0];
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    const normal = calculateNormal(v0, v1, v2);

    stl += `  facet normal ${normal[0].toFixed(6)} ${normal[1].toFixed(6)} ${normal[2].toFixed(6)}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v0[0].toFixed(6)} ${v0[1].toFixed(6)} ${v0[2].toFixed(6)}\n`;
    stl += `      vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}\n`;
    stl += `      vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }

  stl += `endsolid crystal\n`;

  return stl;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { cdl, scale = 10 } = body;

    // Validate input
    const validation = validateCDL(cdl);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate scale
    const scaleValue = Math.max(1, Math.min(100, Number(scale) || 10));

    // Generate STL
    const stl = generatePlaceholderSTL(cdl, scaleValue);

    return new Response(stl, {
      status: 200,
      headers: {
        'Content-Type': 'model/stl',
        'Content-Disposition': 'attachment; filename="crystal.stl"',
      },
    });
  } catch (error) {
    console.error('STL export error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
