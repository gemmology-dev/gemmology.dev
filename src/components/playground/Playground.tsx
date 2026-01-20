import { useState, useEffect, useCallback } from 'react';
import { CDLEditor } from './CDLEditor';
import { CDLPreview } from './CDLPreview';
import { PresetSelector } from './PresetSelector';
import { ExportPanel } from './ExportPanel';
import { ViewControls } from '../crystal/ViewControls';
import { useCDLValidation } from '../../hooks/useCDLValidation';

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

  const { validation, validate } = useCDLValidation({ debounceMs: 500 });

  // Generate preview SVG (mock implementation - would call backend API in production)
  const generatePreview = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSvgContent(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // In production, this would call an API endpoint
      // For now, generate a placeholder SVG based on the CDL
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

      // Generate a simple octahedron SVG as placeholder
      const svg = `
        <svg viewBox="-150 -150 300 300" xmlns="http://www.w3.org/2000/svg">
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
          <polygon points="0,-100 -80,0 0,100" fill="url(#face2)" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
          <polygon points="0,-100 0,100 80,0" fill="url(#face1)" stroke="#0369a1" stroke-width="1.5" opacity="0.7"/>
          <polygon points="0,-100 -80,0 80,0" fill="url(#face1)" stroke="#0369a1" stroke-width="2"/>
          <polygon points="0,100 -80,0 80,0" fill="url(#face2)" stroke="#0369a1" stroke-width="2"/>
          <text x="0" y="130" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">${code.split(':')[0] || 'crystal'}</text>
        </svg>
      `;

      setSvgContent(svg);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Validate and generate preview when code changes
  useEffect(() => {
    validate(cdlCode);
    generatePreview(cdlCode);
  }, [cdlCode, validate, generatePreview]);

  const handlePresetSelect = useCallback((preset: { cdl: string }) => {
    setCdlCode(preset.cdl);
  }, []);

  const handleExport = useCallback((format: 'svg' | 'stl' | 'gltf' | 'gemcad') => {
    // In production, would call API to generate export format
    console.log(`Exporting as ${format}...`);
    alert(`Export to ${format.toUpperCase()} would be triggered here. This requires a backend API.`);
  }, []);

  const handleViewChange = useCallback((newElevation: number, newAzimuth: number) => {
    setElevation(newElevation);
    setAzimuth(newAzimuth);
    // In production, would regenerate preview with new view angles
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
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 text-sm font-medium text-slate-700">
            Preview
          </div>
          <div className="flex-1 p-4">
            <CDLPreview
              svgContent={svgContent}
              loading={previewLoading}
              error={previewError}
              className="h-full"
            />
          </div>
          <div className="px-4 pb-4">
            <ViewControls
              elevation={elevation}
              azimuth={azimuth}
              onElevationChange={(e) => handleViewChange(e, azimuth)}
              onAzimuthChange={(a) => handleViewChange(elevation, a)}
              onReset={() => handleViewChange(30, -45)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
