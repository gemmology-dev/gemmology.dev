import { useEffect, useCallback, useState } from 'react';
import { FGAInfoPanel } from '../crystal/InfoPanel';
import { Crystal3DViewer } from '../crystal/Crystal3DViewer';
import { ViewerToggle } from '../crystal/ViewerToggle';
import { Button } from '../ui/Button';
import type { Mineral } from '../../lib/db';
import { getModelSVG, getModelSTL, getModelGLTF } from '../../lib/db';
import { mineralSlug } from '../../lib/slug';
import { sanitizeSvg } from '../../lib/sanitize-svg';

interface MineralModalProps {
  mineral: Mineral;
  onClose: () => void;
}

type ViewMode = '2d' | '3d';

export function MineralModal({ mineral, onClose }: MineralModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [gltfData, setGltfData] = useState<object | null>(null);
  const [isLoadingSvg, setIsLoadingSvg] = useState(true);
  const [isLoadingGltf, setIsLoadingGltf] = useState(false);

  // Load SVG from database on mount
  useEffect(() => {
    const loadSvg = async () => {
      setIsLoadingSvg(true);
      try {
        const svg = await getModelSVG(mineral.id);
        // Sanitize SVG to prevent XSS
        setSvgContent(svg ? sanitizeSvg(svg) : null);
      } catch (error) {
        console.error('Failed to load SVG from database:', error);
      } finally {
        setIsLoadingSvg(false);
      }
    };
    loadSvg();
  }, [mineral.id]);

  // Load glTF when switching to 3D mode
  useEffect(() => {
    if (viewMode === '3d' && !gltfData) {
      const loadGltf = async () => {
        setIsLoadingGltf(true);
        try {
          const gltf = await getModelGLTF(mineral.id);
          setGltfData(gltf);
        } catch (error) {
          console.error('Failed to load glTF from database:', error);
        } finally {
          setIsLoadingGltf(false);
        }
      };
      loadGltf();
    }
  }, [viewMode, mineral.id, gltfData]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // Download handlers
  const handleDownloadSVG = async () => {
    const svg = await getModelSVG(mineral.id);
    if (svg) {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mineralSlug(mineral.name)}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadSTL = async () => {
    const stl = await getModelSTL(mineral.id);
    if (stl) {
      const url = URL.createObjectURL(stl);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mineralSlug(mineral.name)}.stl`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadGLTF = async () => {
    const gltf = await getModelGLTF(mineral.id);
    if (gltf) {
      const blob = new Blob([JSON.stringify(gltf, null, 2)], { type: 'model/gltf+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mineralSlug(mineral.name)}.gltf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Fallback SVG path for older database without pre-generated models
  const fallbackSvgPath = `/crystals/${mineralSlug(mineral.name)}.svg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Crystal Preview */}
          <div className="lg:w-1/2 bg-slate-50 p-8 flex flex-col">
            {/* Viewer Toggle */}
            <div className="flex justify-center mb-4">
              <ViewerToggle
                mode={viewMode}
                onModeChange={setViewMode}
                disabled={isLoadingSvg && viewMode === '2d'}
              />
            </div>

            {/* Crystal Visualization */}
            <div className="flex-1 flex items-center justify-center relative">
              {viewMode === '2d' ? (
                <div className="w-full max-w-sm aspect-square relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
                  {isLoadingSvg ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
                    </div>
                  ) : svgContent ? (
                    <div
                      className="relative w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&_[id^=grid3d]]:hidden [&_[id^=pane3d]]:hidden [&_[id^=axis3d]]:hidden [&_[id^=line2d]]:hidden [&_[id^=xtick]]:hidden [&_[id^=text]]:hidden [&_[id^=Line3D]]:hidden"
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  ) : (
                    // Fallback to file-based SVG
                    <img
                      src={fallbackSvgPath}
                      alt={mineral.name}
                      className="relative w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full aspect-square relative">
                  {isLoadingGltf ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2" />
                        <div className="text-sm text-slate-500">Loading 3D model...</div>
                      </div>
                    </div>
                  ) : (
                    <Crystal3DViewer gltfData={gltfData} autoRotate={true} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:w-1/2 p-8 overflow-y-auto">
            <FGAInfoPanel
              mineral={{
                name: mineral.name,
                system: mineral.system,
                chemistry: mineral.chemistry,
                hardness: mineral.hardness,
                sg: mineral.sg,
                ri: mineral.ri,
                birefringence: mineral.birefringence,
                pleochroism: mineral.pleochroism,
                dispersion: mineral.dispersion,
                lustre: mineral.lustre,
                cleavage: mineral.cleavage,
                fracture: mineral.fracture,
                cdl: mineral.cdl,
              }}
            />

            {/* Action Buttons */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    window.location.href = `/minerals/${mineralSlug(mineral.name)}`;
                  }}
                >
                  View Full Details
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const encodedCDL = encodeURIComponent(mineral.cdl);
                    window.location.href = `/playground?cdl=${encodedCDL}`;
                  }}
                >
                  Open in Playground
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </Button>
              </div>

              {/* Download Buttons */}
              <div className="border-t border-slate-200 pt-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Download Models</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadSVG}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    title="Download 2D SVG visualization"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    SVG
                  </button>
                  <button
                    onClick={handleDownloadSTL}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    title="Download STL for 3D printing"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    STL
                  </button>
                  <button
                    onClick={handleDownloadGLTF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    title="Download glTF for 3D viewers"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    glTF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
