import { useEffect, useCallback } from 'react';
import { FGAInfoPanel } from '../crystal/InfoPanel';
import { Button } from '../ui/Button';
import type { Mineral } from '../../lib/db';

interface MineralModalProps {
  mineral: Mineral;
  onClose: () => void;
}

export function MineralModal({ mineral, onClose }: MineralModalProps) {
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

  const svgPath = `/crystals/${mineral.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '').replace(/\//g, '-')}.svg`;

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
          <div className="lg:w-1/2 bg-slate-50 p-8 flex items-center justify-center">
            <div className="w-full max-w-sm aspect-square relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
              <img
                src={svgPath}
                alt={mineral.name}
                className="relative w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
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

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="primary"
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

              <Button
                variant="secondary"
                onClick={() => {
                  window.open(svgPath, '_blank');
                }}
              >
                Download SVG
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
