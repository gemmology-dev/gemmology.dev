/**
 * HeroCrystal3D - Decorative 3D crystal for the home page hero section
 * Simplified version of Crystal3DViewer with:
 * - No user interaction (no OrbitControls)
 * - Automatic Y-axis rotation only
 * - Self-loading mineral data from database
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Edges } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { getModelGLTF } from '../../lib/db';

interface HeroCrystal3DProps {
  mineralName?: string;
  rotationSpeed?: number;
  scale?: number;
  className?: string;
}

/**
 * Parse glTF data and create Three.js geometry
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

    return geometry;
  } catch (error) {
    console.error('Error parsing glTF:', error);
    return null;
  }
}

interface RotatingCrystalProps {
  gltfData: object;
  rotationSpeed: number;
  scale: number;
}

/**
 * Rotating crystal mesh with Y-axis auto-rotation
 */
function RotatingCrystal({ gltfData, rotationSpeed, scale }: RotatingCrystalProps) {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    return parseGLTFToGeometry(gltfData);
  }, [gltfData]);

  // Y-axis rotation animation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} scale={scale}>
      <mesh geometry={geometry}>
        {/* Standard material with proper lighting response for 3D depth */}
        <meshStandardMaterial
          color="#7dd3fc"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.1}
        />
        {/* Dark edges matching SVG outline style */}
        <Edges
          threshold={15}
          color="#0369a1"
          lineWidth={1.5}
        />
      </mesh>
    </group>
  );
}

/**
 * Loading fallback - wireframe octahedron
 */
function LoadingFallback({ rotationSpeed }: { rotationSpeed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.7, 0]} />
      <meshBasicMaterial color="#94a3b8" wireframe />
    </mesh>
  );
}

/**
 * Main hero crystal component
 */
export function HeroCrystal3D({
  mineralName = 'Diamond',
  rotationSpeed = 0.3,
  scale = 1.8,
  className = '',
}: HeroCrystal3DProps) {
  const [isClient, setIsClient] = useState(false);
  const [gltfData, setGltfData] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Only render on client side (Three.js requires DOM)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load mineral glTF data
  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;

    async function loadMineral() {
      try {
        const data = await getModelGLTF(mineralName);
        if (!cancelled && data) {
          setGltfData(data);
        }
      } catch (error) {
        console.error('Failed to load mineral:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMineral();

    return () => {
      cancelled = true;
    };
  }, [isClient, mineralName]);

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [2.5, 1.5, 2.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingFallback rotationSpeed={rotationSpeed} />}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <directionalLight position={[-4, 2, -2]} intensity={0.4} />
          <directionalLight position={[0, -3, 3]} intensity={0.2} />

          <Center position={[0, 0.15, 0]}>
            {gltfData ? (
              <RotatingCrystal gltfData={gltfData} rotationSpeed={rotationSpeed} scale={scale} />
            ) : (
              <LoadingFallback rotationSpeed={rotationSpeed} />
            )}
          </Center>
        </Suspense>
      </Canvas>
    </div>
  );
}
