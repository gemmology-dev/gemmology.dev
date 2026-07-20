/**
 * MineralCrystalViewer - SVG-first crystal preview with progressive 3D enhancement
 *
 * Renders the server-provided SVG (or the file-based fallback image) as the
 * default, no-JS-safe view inside the gem page's specimen plate. When a
 * pre-generated glTF model is present AND WebGL is available client-side,
 * a <ViewerToggle> appears so visitors can switch to an interactive 3D
 * render (Crystal3DViewer). The glTF JSON string is only parsed lazily, the
 * first time the visitor switches to 3D, and the parsed object is cached so
 * toggling back and forth doesn't reparse.
 *
 * Reference wiring pattern: FamilyModal.tsx (lazy JSON.parse on 3D switch)
 * and MineralModal.tsx (specimen-plate + ViewerToggle layout).
 */
import { useEffect, useRef, useState } from 'react';
import { Crystal3DViewer } from '../crystal/Crystal3DViewer';
import { ViewerToggle } from '../crystal/ViewerToggle';
import { isWebGLAvailable, prefersReducedMotion } from '../../lib/webgl';

type ViewMode = '2d' | '3d';

interface MineralCrystalViewerProps {
  /** Cleaned inline SVG markup (may be empty — falls back to svgPath). */
  svgHtml?: string;
  /** File-based SVG fallback, e.g. /crystals/{id}.svg */
  svgPath: string;
  /** Pre-generated glTF model as a JSON string, or null/undefined if none exists. */
  gltfJson?: string | null;
  name: string;
}

export function MineralCrystalViewer({
  svgHtml = '',
  svgPath,
  gltfJson = null,
  name,
}: MineralCrystalViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [canRender3D, setCanRender3D] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [gltfData, setGltfData] = useState<object | null>(null);
  const [isLoadingGltf, setIsLoadingGltf] = useState(false);

  // Cache the parsed glTF across toggles so we only JSON.parse once per page view.
  const parsedGltfRef = useRef<object | null>(null);

  // WebGL support can only be probed client-side — SSR-safe like HeroCrystal3D.
  useEffect(() => {
    setIsClient(true);
    setCanRender3D(isWebGLAvailable());
  }, []);

  // Only 208/216 minerals ship a model; hide the toggle entirely for the rest
  // and never attempt to render 3D without both a model and WebGL support.
  const showToggle = isClient && canRender3D && !!gltfJson;

  // Lazily parse the glTF the first time the visitor switches to 3D.
  useEffect(() => {
    if (viewMode !== '3d' || !gltfJson) return;

    if (parsedGltfRef.current) {
      setGltfData(parsedGltfRef.current);
      return;
    }

    setIsLoadingGltf(true);
    setGltfData(null);

    try {
      const parsed = JSON.parse(gltfJson) as object;
      parsedGltfRef.current = parsed;
      setGltfData(parsed);
    } catch (error) {
      console.error(`MineralCrystalViewer: failed to parse glTF for "${name}":`, error);
      parsedGltfRef.current = null;
      // Don't get stuck on an empty 3D pane — fall back to the SVG that's
      // guaranteed to render.
      setViewMode('2d');
    } finally {
      setIsLoadingGltf(false);
    }
  }, [viewMode, gltfJson, name]);

  const hasSvg = svgHtml.length > 0;
  const show3D = viewMode === '3d' && showToggle;

  return (
    <div className="relative w-full h-full">
      {/* Crystal preview — permanent light "specimen plate", see docs/dark-mode.md §6 */}
      <div
        className="w-full h-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-center dark:border dark:border-coffee-border"
        {...(!show3D ? { role: 'img', 'aria-label': `${name} crystal structure` } : {})}
      >
        {show3D ? (
          isLoadingGltf || !gltfData ? (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div
                className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full"
                aria-hidden="true"
              />
              <span className="text-xs">Loading 3D model…</span>
            </div>
          ) : (
            <Crystal3DViewer
              gltfData={gltfData}
              autoRotate={!prefersReducedMotion()}
              className="w-full h-full"
            />
          )
        ) : hasSvg ? (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <img
            src={svgPath}
            alt={`${name} crystal structure`}
            className="max-w-full max-h-full object-contain"
            loading="eager"
            onError={(e) => {
              // Guarded fallback — without clearing onerror first, a missing
              // placeholder.svg would retrigger this handler forever (P0 loop fix).
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/crystals/placeholder.svg';
            }}
          />
        )}
      </div>

      {showToggle && (
        <div
          className="absolute bottom-1.5 inset-x-0 flex justify-center"
          role="group"
          aria-label={`${name} view mode`}
        >
          <ViewerToggle
            mode={viewMode}
            onModeChange={setViewMode}
            className="scale-[0.72] origin-bottom shadow-md"
          />
        </div>
      )}
    </div>
  );
}
