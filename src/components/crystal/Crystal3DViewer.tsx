/**
 * Crystal3DViewer - Three.js WebGL crystal renderer
 * Uses React Three Fiber for declarative Three.js in React
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Edges } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface Crystal3DViewerProps {
  gltfData: object | null;
  autoRotate?: boolean;
  className?: string;
}

interface CrystalMeshProps {
  gltfData: object;
}

/**
 * Parse glTF data and create Three.js geometry
 * Automatically scales geometry to fit within a unit sphere
 */
function parseGLTFToGeometry(gltfData: any): THREE.BufferGeometry | null {
  try {
    if (!gltfData.buffers || !gltfData.accessors || !gltfData.bufferViews) {
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

    // Extract position data
    const posAccessor = gltfData.accessors[0];
    const posBufferView = gltfData.bufferViews[0];
    const posData = new Float32Array(
      bytes.buffer,
      posBufferView.byteOffset,
      posAccessor.count * 3
    );

    // Extract normal data
    const normAccessor = gltfData.accessors[1];
    const normBufferView = gltfData.bufferViews[1];
    const normData = new Float32Array(
      bytes.buffer,
      normBufferView.byteOffset,
      normAccessor.count * 3
    );

    // Extract index data
    const idxAccessor = gltfData.accessors[2];
    const idxBufferView = gltfData.bufferViews[2];
    const idxData = new Uint16Array(
      bytes.buffer,
      idxBufferView.byteOffset,
      idxAccessor.count
    );

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posData, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normData, 3));
    geometry.setIndex(new THREE.BufferAttribute(idxData, 1));

    // Normalize geometry to fit within a unit sphere
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) {
      const scale = 1.5 / geometry.boundingSphere.radius;
      geometry.scale(scale, scale, scale);
      geometry.center();
    }

    return geometry;
  } catch (error) {
    console.error('Error parsing glTF:', error);
    return null;
  }
}

/**
 * Crystal mesh component that renders the geometry
 */
function CrystalMesh({ gltfData }: CrystalMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    return parseGLTFToGeometry(gltfData);
  }, [gltfData]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      {/* Flat-shaded faces matching SVG style */}
      <meshBasicMaterial
        color="#7dd3fc"
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
      {/* Edge lines for crystal facets */}
      <Edges
        threshold={15}
        color="#0369a1"
        lineWidth={2}
      />
    </mesh>
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
