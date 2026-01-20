import { useState, useEffect, useCallback } from 'react';
import { CDLEditor } from './CDLEditor';
import { CDLPreview } from './CDLPreview';
import { PresetSelector } from './PresetSelector';
import { ExportPanel } from './ExportPanel';
import { ViewControls } from '../crystal/ViewControls';
import { Crystal3DViewer } from '../crystal/Crystal3DViewer';
import { ViewerToggle } from '../crystal/ViewerToggle';
import { useCDLValidation } from '../../hooks/useCDLValidation';

// API URL from environment (defaults to production if not set)
const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.gemmology.dev';

// Sample presets (in real app, would come from mineral-database)
const SAMPLE_PRESETS = [
  { name: 'Diamond', cdl: 'cubic[m3m]:{111}@1.0', system: 'Cubic' },
  { name: 'Truncated Octahedron', cdl: 'cubic[m3m]:{111}@1.0 + {100}@1.3', system: 'Cubic' },
  { name: 'Fluorite', cdl: 'cubic[m3m]:{111}@1.0 + {100}@0.8', system: 'Cubic' },
  { name: 'Garnet', cdl: 'cubic[m3m]:{110}@1.0 + {211}@1.2', system: 'Cubic' },
  { name: 'Quartz', cdl: 'trigonal[-3m]:{10-10}@1.0 + {10-11}@0.8 + {01-11}@0.9', system: 'Trigonal' },
  { name: 'Beryl', cdl: 'hexagonal[6/mmm]:{10-10}@1.0 + {0001}@1.2', system: 'Hexagonal' },
  { name: 'Zircon', cdl: 'tetragonal[4/mmm]:{110}@1.0 + {101}@0.9 + {100}@1.3', system: 'Tetragonal' },
  { name: 'Topaz', cdl: 'orthorhombic[mmm]:{110}@1.0 + {120}@1.1 + {011}@0.9', system: 'Orthorhombic' },
  { name: 'Orthoclase', cdl: 'monoclinic[2/m]:{001}@1.0 + {010}@1.1 + {110}@0.9', system: 'Monoclinic' },
];

const DEFAULT_CDL = 'cubic[m3m]:{111}@1.0';

interface PlaygroundProps {
  initialCDL?: string;
}

export function Playground({ initialCDL }: PlaygroundProps) {
  const [cdlCode, setCdlCode] = useState(initialCDL || DEFAULT_CDL);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [elevation, setElevation] = useState(30);
  const [azimuth, setAzimuth] = useState(-45);

  // 3D viewer state
  const [viewerMode, setViewerMode] = useState<'2d' | '3d'>('2d');
  const [gltfData, setGltfData] = useState<object | null>(null);
  const [gltfLoading, setGltfLoading] = useState(false);

  const { validation, validate } = useCDLValidation({ debounceMs: 500 });

  // Generate preview SVG using the render API
  const generatePreview = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSvgContent(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch(`${API_URL}/api/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdl: code,
          elev: elevation,
          azim: azimuth,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to render crystal');
      }

      const svg = await response.text();
      setSvgContent(svg);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [elevation, azimuth]);

  // Fetch glTF data for 3D viewer
  const fetchGltfData = useCallback(async (code: string) => {
    if (!code.trim()) {
      setGltfData(null);
      return;
    }

    setGltfLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/export/gltf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cdl: code, scale: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch 3D model');
      }

      const data = await response.json();
      setGltfData(data);
    } catch (err) {
      console.error('glTF fetch error:', err);
      setGltfData(null);
    } finally {
      setGltfLoading(false);
    }
  }, []);

  // Validate and generate preview when code or view angles change
  useEffect(() => {
    validate(cdlCode);
    generatePreview(cdlCode);
  }, [cdlCode, elevation, azimuth, validate, generatePreview]);

  // Fetch glTF when switching to 3D mode or when code changes while in 3D mode
  useEffect(() => {
    if (viewerMode === '3d' && validation.isValid) {
      fetchGltfData(cdlCode);
    }
  }, [viewerMode, cdlCode, validation.isValid, fetchGltfData]);

  const handlePresetSelect = useCallback((preset: { cdl: string }) => {
    setCdlCode(preset.cdl);
  }, []);

  const handleExport = useCallback(async (format: 'svg' | 'stl' | 'gltf' | 'gemcad') => {
    if (format === 'svg') {
      // SVG is handled by ExportPanel directly from svgContent
      return;
    }

    if (format === 'gemcad') {
      // GEMCAD export not yet implemented
      alert('GEMCAD export is not yet available.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cdl: cdlCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to export as ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crystal.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to export as ${format.toUpperCase()}`);
    }
  }, [cdlCode]);

  const handleViewChange = useCallback((newElevation: number, newAzimuth: number) => {
    setElevation(newElevation);
    setAzimuth(newAzimuth);
  }, []);

  const handleViewerModeChange = useCallback((mode: '2d' | '3d') => {
    setViewerMode(mode);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <PresetSelector presets={SAMPLE_PRESETS} onSelect={handlePresetSelect} />

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2 text-sm">
            {validation.isValid ? (
              <span className="flex items-center gap-1 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Valid CDL
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <ExportPanel
          svgContent={svgContent}
          cdlCode={cdlCode}
          onExport={handleExport}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Editor panel */}
        <div className="w-1/2 border-r border-slate-200 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 text-sm font-medium text-slate-700">
            CDL Editor
          </div>
          <CDLEditor
            value={cdlCode}
            onChange={setCdlCode}
            errors={validation.errors}
            className="flex-1"
          />
        </div>

        {/* Preview panel */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Preview</span>
            <ViewerToggle
              mode={viewerMode}
              onModeChange={handleViewerModeChange}
              disabled={!validation.isValid}
            />
          </div>

          <div className="flex-1 p-4 relative">
            {viewerMode === '2d' ? (
              <CDLPreview
                svgContent={svgContent}
                loading={previewLoading}
                error={previewError}
                className="h-full"
              />
            ) : (
              <div className="h-full relative">
                {gltfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
                    <div className="flex items-center gap-3 text-slate-500">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Loading 3D model...</span>
                    </div>
                  </div>
                )}
                <Crystal3DViewer
                  gltfData={gltfData}
                  autoRotate={true}
                  className="h-full rounded-lg"
                />
              </div>
            )}
          </div>

          {/* View controls only shown in 2D mode */}
          {viewerMode === '2d' && (
            <div className="px-4 pb-4">
              <ViewControls
                elevation={elevation}
                azimuth={azimuth}
                onElevationChange={(e) => handleViewChange(e, azimuth)}
                onAzimuthChange={(a) => handleViewChange(elevation, a)}
                onReset={() => handleViewChange(30, -45)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
