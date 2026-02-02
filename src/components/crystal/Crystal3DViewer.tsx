/**
 * Crystal3DViewer - Three.js WebGL crystal renderer
 * Uses React Three Fiber for declarative Three.js in React
 */

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

interface Crystal3DViewerProps {
  gltfData: object | null;
  autoRotate?: boolean;
  className?: string;
}

interface CrystalMeshProps {
  gltfData: object;
}

interface ParsedGeometry {
  geometry: THREE.BufferGeometry;
  crystalEdges: number[][] | null; // Original polygon edges [v0, v1][]
}

/**
 * Parse glTF data and create Three.js geometry
 * Follows glTF 2.0 spec by reading mesh primitives to find accessor indices
 * Handles accessor.byteOffset + bufferView.byteOffset correctly
 * Copies data to avoid TypedArray byte alignment issues
 * Also extracts original polygon edges from extras.crystalEdges if available
 */
function parseGLTFToGeometry(gltfData: any): ParsedGeometry | null {
  try {
    if (!gltfData.buffers || !gltfData.accessors || !gltfData.bufferViews || !gltfData.meshes) {
      return null;
    }

    // Decode base64 buffer
    const bufferUri = gltfData.buffers[0].uri;
    const base64 = bufferUri.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Get the first mesh primitive (glTF spec: follow references, don't assume order)
    const mesh = gltfData.meshes[0];
    if (!mesh || !mesh.primitives || mesh.primitives.length === 0) {
      console.error('No mesh primitives found in glTF');
      return null;
    }

    const primitive = mesh.primitives[0];

    // Get accessor indices from primitive attributes
    const posAccessorIdx = primitive.attributes?.POSITION;
    const normAccessorIdx = primitive.attributes?.NORMAL;
    const indicesAccessorIdx = primitive.indices;

    if (posAccessorIdx === undefined || indicesAccessorIdx === undefined) {
      console.error('Missing required POSITION or indices in glTF primitive');
      return null;
    }

    // Get accessors using the indices from the primitive
    const posAccessor = gltfData.accessors[posAccessorIdx];
    const idxAccessor = gltfData.accessors[indicesAccessorIdx];

    // Get bufferViews using the bufferView property from each accessor
    const posBufferView = gltfData.bufferViews[posAccessor.bufferView];
    const idxBufferView = gltfData.bufferViews[idxAccessor.bufferView];

    // Use DataView to safely read data regardless of byte alignment
    const dataView = new DataView(bytes.buffer);

    // Extract position data (Float32, VEC3)
    // Total offset = bufferView.byteOffset + accessor.byteOffset
    const posOffset = (posBufferView.byteOffset || 0) + (posAccessor.byteOffset || 0);
    const posData = new Float32Array(posAccessor.count * 3);
    for (let i = 0; i < posAccessor.count * 3; i++) {
      posData[i] = dataView.getFloat32(posOffset + i * 4, true); // little-endian
    }

    // Extract index data (handle both Uint16 and Uint32)
    const idxOffset = (idxBufferView.byteOffset || 0) + (idxAccessor.byteOffset || 0);
    const idxComponentType = idxAccessor.componentType;
    let idxData: Uint16Array | Uint32Array;

    if (idxComponentType === 5125) {
      // UNSIGNED_INT (4 bytes)
      idxData = new Uint32Array(idxAccessor.count);
      for (let i = 0; i < idxAccessor.count; i++) {
        idxData[i] = dataView.getUint32(idxOffset + i * 4, true);
      }
    } else {
      // UNSIGNED_SHORT (2 bytes) - default
      idxData = new Uint16Array(idxAccessor.count);
      for (let i = 0; i < idxAccessor.count; i++) {
        idxData[i] = dataView.getUint16(idxOffset + i * 2, true);
      }
    }

    // Validate indices are within bounds
    const vertexCount = posAccessor.count;
    let maxIndex = 0;
    for (let i = 0; i < idxData.length; i++) {
      if (idxData[i] > maxIndex) maxIndex = idxData[i];
      if (idxData[i] >= vertexCount) {
        console.error(`Index ${idxData[i]} at position ${i} exceeds vertex count ${vertexCount}`);
        return null;
      }
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posData, 3));
    geometry.setIndex(new THREE.BufferAttribute(idxData, 1));

    // Extract normal data if available
    if (normAccessorIdx !== undefined) {
      const normAccessor = gltfData.accessors[normAccessorIdx];
      const normBufferView = gltfData.bufferViews[normAccessor.bufferView];
      const normOffset = (normBufferView.byteOffset || 0) + (normAccessor.byteOffset || 0);
      const normData = new Float32Array(normAccessor.count * 3);
      for (let i = 0; i < normAccessor.count * 3; i++) {
        normData[i] = dataView.getFloat32(normOffset + i * 4, true);
      }
      geometry.setAttribute('normal', new THREE.BufferAttribute(normData, 3));
    } else {
      // Compute normals if not provided
      geometry.computeVertexNormals();
    }

    // Normalize geometry to fit within a unit sphere
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) {
      const scale = 1.5 / geometry.boundingSphere.radius;
      geometry.scale(scale, scale, scale);
      geometry.center();
    }

    // Extract original polygon edges from extras if available
    const crystalEdges = gltfData.extras?.crystalEdges ?? null;

    return { geometry, crystalEdges };
  } catch (error) {
    console.error('Error parsing glTF:', error);
    return null;
  }
}

/**
 * Crystal mesh component that renders the geometry
 * Creates both face and edge geometry in sync to avoid WebGL errors
 * Uses Line2 for thick edges that work across all platforms
 */
function CrystalMesh({ gltfData }: CrystalMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<Line2>(null);
  const { size } = useThree();

  // Create face geometry, Line2 object with geometry and material together
  const { faceGeometry, line2 } = useMemo(() => {
    const parsed = parseGLTFToGeometry(gltfData);
    if (!parsed) {
      return { faceGeometry: null, line2: null };
    }

    const { geometry: faceGeom, crystalEdges } = parsed;

    // Build line positions from original polygon edges (not triangulation edges)
    // This avoids showing internal fan triangulation artifacts
    const positionAttr = faceGeom.getAttribute('position') as THREE.BufferAttribute;
    const positions: number[] = [];

    if (crystalEdges && crystalEdges.length > 0) {
      // Use original polygon edges from glTF extras
      for (const [v0, v1] of crystalEdges) {
        positions.push(
          positionAttr.getX(v0), positionAttr.getY(v0), positionAttr.getZ(v0),
          positionAttr.getX(v1), positionAttr.getY(v1), positionAttr.getZ(v1)
        );
      }
    } else {
      // Fallback: use EdgesGeometry for backward compatibility with old glTF data
      const edgeGeom = new THREE.EdgesGeometry(faceGeom, 30);
      const edgePositions = edgeGeom.attributes.position.array as Float32Array;
      positions.push(...Array.from(edgePositions));
      edgeGeom.dispose();
    }

    // Create LineGeometry for Line2
    const lineGeom = new LineGeometry();
    lineGeom.setPositions(positions);

    // Create LineMaterial with screen-space line width
    const lineMat = new LineMaterial({
      color: 0x0369a1,
      linewidth: 2, // Width in pixels
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });

    // Create Line2 object
    const lineObj = new Line2(lineGeom, lineMat);
    lineObj.computeLineDistances();

    return { faceGeometry: faceGeom, line2: lineObj };
  }, [gltfData]);

  // Update line material resolution when viewport size changes
  useEffect(() => {
    if (line2) {
      (line2.material as LineMaterial).resolution.set(size.width, size.height);
    }
  }, [size, line2]);

  // Cleanup geometries and material on unmount or change
  useEffect(() => {
    return () => {
      if (faceGeometry) faceGeometry.dispose();
      if (line2) {
        line2.geometry.dispose();
        (line2.material as LineMaterial).dispose();
      }
    };
  }, [faceGeometry, line2]);

  if (!faceGeometry || !line2) return null;

  return (
    <group>
      <mesh ref={meshRef} geometry={faceGeometry}>
        {/* Flat-shaded faces matching SVG style */}
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Thick edge lines using Line2 - works across all platforms */}
      <primitive object={line2} ref={lineRef} />
    </group>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <mesh>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#94a3b8" wireframe />
    </mesh>
  );
}

/**
 * Main 3D viewer component
 */
export function Crystal3DViewer({
  gltfData,
  autoRotate = true,
  className = '',
}: Crystal3DViewerProps) {
  const [isClient, setIsClient] = useState(false);

  // Only render on client side (Three.js requires DOM)
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <div className="text-slate-400">Loading 3D viewer...</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[400px] bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [3, 3, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-3, 3, -3]} intensity={0.3} />

          <Center>
            {gltfData ? (
              <CrystalMesh gltfData={gltfData} />
            ) : (
              <LoadingFallback />
            )}
          </Center>

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
            enablePan={false}
            minDistance={2}
            maxDistance={10}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>

      {/* Viewer controls overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
