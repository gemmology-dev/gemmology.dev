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

function generatePlaceholderGLTF(cdl: string, scale: number = 1): object {
  // Generate a simple glTF 2.0 for an octahedron
  // In production, this would use crystal-geometry and crystal-renderer packages

  const s = scale;

  // Octahedron vertices
  const vertices = [
    0, 0, s,     // 0: top
    s, 0, 0,     // 1: right
    0, s, 0,     // 2: front
    -s, 0, 0,    // 3: left
    0, -s, 0,    // 4: back
    0, 0, -s,    // 5: bottom
  ];

  // Octahedron faces (8 triangular faces, indices)
  const indices = [
    // Top 4 faces
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 1,
    // Bottom 4 faces
    5, 2, 1,
    5, 3, 2,
    5, 4, 3,
    5, 1, 4,
  ];

  // Convert to typed arrays and base64
  const positionBuffer = new Float32Array(vertices);
  const indexBuffer = new Uint16Array(indices);

  const positionBase64 = Buffer.from(positionBuffer.buffer).toString('base64');
  const indexBase64 = Buffer.from(indexBuffer.buffer).toString('base64');

  const gltf = {
    asset: {
      version: '2.0',
      generator: 'gemmology.dev crystal-renderer',
    },
    scene: 0,
    scenes: [
      {
        nodes: [0],
      },
    ],
    nodes: [
      {
        mesh: 0,
        name: 'Crystal',
      },
    ],
    meshes: [
      {
        primitives: [
          {
            attributes: {
              POSITION: 0,
            },
            indices: 1,
            material: 0,
          },
        ],
        name: 'Crystal Mesh',
      },
    ],
    materials: [
      {
        name: 'Crystal Material',
        pbrMetallicRoughness: {
          baseColorFactor: [0.055, 0.647, 0.914, 0.85], // #0ea5e9 with alpha
          metallicFactor: 0.0,
          roughnessFactor: 0.3,
        },
        alphaMode: 'BLEND',
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: 6,
        type: 'VEC3',
        max: [s, s, s],
        min: [-s, -s, -s],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: 24,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: positionBuffer.byteLength,
        target: 34962, // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: positionBuffer.byteLength,
        byteLength: indexBuffer.byteLength,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      },
    ],
    buffers: [
      {
        uri: `data:application/octet-stream;base64,${positionBase64}${indexBase64}`,
        byteLength: positionBuffer.byteLength + indexBuffer.byteLength,
      },
    ],
  };

  return gltf;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { cdl, scale = 1 } = body;

    // Validate input
    const validation = validateCDL(cdl);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate scale
    const scaleValue = Math.max(0.1, Math.min(10, Number(scale) || 1));

    // Generate glTF
    const gltf = generatePlaceholderGLTF(cdl, scaleValue);

    return new Response(JSON.stringify(gltf, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf+json',
        'Content-Disposition': 'attachment; filename="crystal.gltf"',
      },
    });
  } catch (error) {
    console.error('glTF export error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
