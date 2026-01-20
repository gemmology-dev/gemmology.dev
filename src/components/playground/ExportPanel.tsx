import { Button } from '../ui/Button';
import { clsx } from 'clsx';

interface ExportPanelProps {
  svgContent: string | null;
  cdlCode: string;
  onExport: (format: 'svg' | 'stl' | 'gltf' | 'gemcad') => void;
  className?: string;
}

export function ExportPanel({ svgContent, cdlCode, onExport, className }: ExportPanelProps) {
  const canExport = !!svgContent;

  const handleCopyCDL = () => {
    navigator.clipboard.writeText(cdlCode);
  };

  const handleCopySVG = () => {
    if (svgContent) {
      navigator.clipboard.writeText(svgContent);
    }
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crystal.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareURL = () => {
    const encoded = encodeURIComponent(cdlCode);
    const url = `${window.location.origin}/playground?cdl=${encoded}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownloadSVG}
          disabled={!canExport}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download SVG
        </Button>

        <Button variant="secondary" size="sm" onClick={() => onExport('stl')} disabled={!canExport}>
          STL
        </Button>

        <Button variant="secondary" size="sm" onClick={() => onExport('gltf')} disabled={!canExport}>
          glTF
        </Button>

        <Button variant="secondary" size="sm" onClick={() => onExport('gemcad')} disabled={!canExport}>
          GEMCAD
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={handleCopyCDL}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy CDL
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopySVG} disabled={!canExport}>
          Copy SVG
        </Button>

        <Button variant="ghost" size="sm" onClick={handleShareURL}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share URL
        </Button>
      </div>
    </div>
  );
}
