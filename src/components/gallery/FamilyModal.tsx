import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { Badge } from '../ui/Badge';
import { Crystal3DViewer } from '../crystal/Crystal3DViewer';
import { ViewerToggle } from '../crystal/ViewerToggle';
import { Button } from '../ui/Button';
import { useFamilyExpressions } from '../../hooks/useFamilies';
import type { MineralFamily, MineralExpression } from '../../lib/db';
import { sanitizeSvg } from '../../lib/sanitize-svg';
import { clsx } from 'clsx';

interface FamilyModalProps {
  family: MineralFamily;
  onClose: () => void;
}

type ViewMode = '2d' | '3d';

/**
 * Modal for displaying a mineral family with expression selector.
 */
export function FamilyModal({ family, onClose }: FamilyModalProps) {
  const { expressions, loading: expressionsLoading } = useFamilyExpressions(family.id);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [selectedExpression, setSelectedExpression] = useState<MineralExpression | null>(null);
  const [gltfData, setGltfData] = useState<object | null>(null);
  const [isLoadingGltf, setIsLoadingGltf] = useState(false);

  // Select primary expression by default when expressions load
  useEffect(() => {
    if (expressions.length > 0 && !selectedExpression) {
      const primary = expressions.find(e => e.is_primary) || expressions[0];
      setSelectedExpression(primary);
    }
  }, [expressions, selectedExpression]);

  // Track which expression's glTF is currently loaded
  const loadedExpressionId = useRef<string | null>(null);

  // Load glTF when switching to 3D mode OR when expression changes while in 3D
  useEffect(() => {
    // Only load if in 3D mode
    if (viewMode !== '3d') {
      return;
    }

    // Check if we need to load new data (expression changed or no data loaded)
    const needsLoad = selectedExpression?.id !== loadedExpressionId.current;

    if (needsLoad && selectedExpression?.model_gltf) {
      setIsLoadingGltf(true);
      setGltfData(null); // Clear old data first

      try {
        const parsed = JSON.parse(selectedExpression.model_gltf as string);
        setGltfData(parsed);
        loadedExpressionId.current = selectedExpression.id;
      } catch (error) {
        console.error('Failed to parse glTF:', error);
        loadedExpressionId.current = null;
      } finally {
        setIsLoadingGltf(false);
      }
    }
  }, [viewMode, selectedExpression?.id, selectedExpression?.model_gltf]);

  // Reset loaded expression tracking when switching away from 3D
  useEffect(() => {
    if (viewMode !== '3d') {
      loadedExpressionId.current = null;
      setGltfData(null);
    }
  }, [viewMode]);

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

  // Sanitize SVG content
  const sanitizedSvg = useMemo(() => {
    if (selectedExpression?.model_svg) {
      return sanitizeSvg(selectedExpression.model_svg);
    }
    if (family.primarySvg) {
      return sanitizeSvg(family.primarySvg);
    }
    return '';
  }, [selectedExpression?.model_svg, family.primarySvg]);

  // Download handlers
  const handleDownloadSVG = () => {
    const svg = selectedExpression?.model_svg || family.primarySvg;
    if (svg) {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExpression?.id || family.id}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadGLTF = () => {
    const gltf = selectedExpression?.model_gltf;
    if (gltf) {
      const blob = new Blob([typeof gltf === 'string' ? gltf : JSON.stringify(gltf, null, 2)], {
        type: 'model/gltf+json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExpression?.id || family.id}.gltf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadSTL = () => {
    const stl = selectedExpression?.model_stl;
    if (stl) {
      const blob = new Blob([stl], { type: 'application/sla' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExpression?.id || family.id}.stl`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Format property display values
  const formatRange = (min: number | undefined, max: number | undefined) => {
    if (min === undefined && max === undefined) return undefined;
    if (min === max || max === undefined) return min?.toString();
    if (min === undefined) return max?.toString();
    return `${min}-${max}`;
  };

  const hardnessDisplay = formatRange(family.hardness_min, family.hardness_max);
  const sgDisplay = formatRange(family.sg_min, family.sg_max);
  const riDisplay = formatRange(family.ri_min, family.ri_max);

  const properties = [
    { label: 'Chemistry', value: family.chemistry },
    { label: 'Hardness', value: hardnessDisplay },
    { label: 'Specific Gravity', value: sgDisplay },
    { label: 'Refractive Index', value: riDisplay },
    { label: 'Birefringence', value: family.birefringence },
    { label: 'Pleochroism', value: family.pleochroism },
    { label: 'Dispersion', value: family.dispersion },
    { label: 'Lustre', value: family.lustre },
    { label: 'Cleavage', value: family.cleavage },
    { label: 'Fracture', value: family.fracture },
  ].filter(p => p.value !== undefined && p.value !== null && p.value !== '');

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
                disabled={!selectedExpression}
              />
            </div>

            {/* Crystal Visualization */}
            <div className="flex-1 flex items-center justify-center relative">
              {viewMode === '2d' ? (
                <div className="w-full max-w-sm aspect-square relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
                  {expressionsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
                    </div>
                  ) : sanitizedSvg ? (
                    <div
                      className="relative w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&_[id^=grid3d]]:hidden [&_[id^=pane3d]]:hidden [&_[id^=axis3d]]:hidden [&_[id^=line2d]]:hidden [&_[id^=xtick]]:hidden [&_[id^=text]]:hidden [&_[id^=Line3D]]:hidden"
                      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
                    />
                  ) : (
                    <img
                      src={`/crystals/${selectedExpression?.id || family.id}.svg`}
                      alt={family.name}
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

            {/* Expression Selector */}
            {expressions.length > 1 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Crystal Forms</div>
                <div className="flex flex-wrap gap-2">
                  {expressions.map((expr) => (
                    <button
                      key={expr.id}
                      onClick={() => setSelectedExpression(expr)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        selectedExpression?.id === expr.id
                          ? 'bg-crystal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      )}
                    >
                      {expr.name}
                      {expr.is_primary && (
                        <span className="ml-1 text-xs opacity-75">(primary)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:w-1/2 p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">{family.name}</h2>
              <Badge variant="crystal">{family.crystal_system}</Badge>
            </div>

            {/* Properties */}
            <div className="space-y-3">
              {properties.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* CDL */}
            {selectedExpression?.cdl && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-700">CDL</span>
                <pre className="mt-2 bg-slate-100 rounded-lg p-3 text-sm font-mono text-slate-700 overflow-x-auto">
                  <code>{selectedExpression.cdl}</code>
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    const url = selectedExpression
                      ? `/minerals/${family.id}?form=${selectedExpression.slug}`
                      : `/minerals/${family.id}`;
                    window.location.href = url;
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
                    const cdl = selectedExpression?.cdl || '';
                    const encodedCDL = encodeURIComponent(cdl);
                    window.location.href = `/playground?cdl=${encodedCDL}`;
                  }}
                  disabled={!selectedExpression?.cdl}
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
                    disabled={!sanitizedSvg}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors"
                    title="Download 2D SVG visualization"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    SVG
                  </button>
                  <button
                    onClick={handleDownloadSTL}
                    disabled={!selectedExpression?.model_stl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors"
                    title="Download STL for 3D printing"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    STL
                  </button>
                  <button
                    onClick={handleDownloadGLTF}
                    disabled={!selectedExpression?.model_gltf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors"
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
