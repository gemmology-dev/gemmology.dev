import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';

interface CrystalCardProps {
  name: string;
  system: string;
  svgContent?: string;
  svgPath?: string;
  chemistry?: string;
  hardness?: string;
  onClick?: () => void;
  className?: string;
}

export function CrystalCard({
  name,
  system,
  svgContent,
  svgPath,
  chemistry,
  hardness,
  onClick,
  className,
}: CrystalCardProps) {
  const systemColors: Record<string, 'crystal' | 'ruby' | 'sapphire' | 'emerald' | 'default'> = {
    cubic: 'crystal',
    hexagonal: 'sapphire',
    trigonal: 'emerald',
    tetragonal: 'ruby',
    orthorhombic: 'default',
    monoclinic: 'default',
    triclinic: 'default',
  };

  return (
    <div
      className={clsx(
        'group rounded-xl border border-slate-200 bg-white overflow-hidden cursor-pointer',
        'transition-all hover:border-crystal-300 hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {/* Preview */}
      <div className="aspect-square bg-slate-50 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-50" />
        <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
          {svgContent ? (
            <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full h-full" />
          ) : svgPath ? (
            <img src={svgPath} alt={name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-crystal-600 transition-colors">
            {name}
          </h3>
          <Badge variant={systemColors[system.toLowerCase()] || 'default'}>
            {system}
          </Badge>
        </div>
        {(chemistry || hardness) && (
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            {chemistry && <span>{chemistry}</span>}
            {hardness && <span>H: {hardness}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
