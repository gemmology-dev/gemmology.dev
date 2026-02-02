import { useState, useMemo } from 'react';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { sanitizeSvg } from '../../lib/sanitize-svg';
import type { MineralFamily } from '../../lib/db';

interface FamilyCardProps {
  family: MineralFamily;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Card component for displaying a mineral family in the gallery.
 * Shows family name, crystal system, expression count, and primary SVG.
 */
export function FamilyCard({
  family,
  href,
  onClick,
  className,
}: FamilyCardProps) {
  const [imageError, setImageError] = useState(false);

  // Sanitize SVG content to prevent XSS
  const sanitizedSvg = useMemo(
    () => (family.primarySvg ? sanitizeSvg(family.primarySvg) : ''),
    [family.primarySvg]
  );

  const systemColors: Record<string, 'crystal' | 'ruby' | 'sapphire' | 'emerald' | 'default'> = {
    cubic: 'crystal',
    hexagonal: 'sapphire',
    trigonal: 'emerald',
    tetragonal: 'ruby',
    orthorhombic: 'default',
    monoclinic: 'default',
    triclinic: 'default',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href
    ? { href, onClick: handleClick }
    : { onClick };

  const expressionCount = family.expressionCount || 0;

  // Format hardness range
  const hardnessDisplay = family.hardness_min && family.hardness_max
    ? family.hardness_min === family.hardness_max
      ? family.hardness_min.toString()
      : `${family.hardness_min}-${family.hardness_max}`
    : null;

  return (
    <Wrapper
      {...wrapperProps}
      className={clsx(
        'group rounded-xl border border-slate-200 bg-white overflow-hidden cursor-pointer block',
        'transition-all hover:border-crystal-300 hover:shadow-lg',
        className
      )}
    >
      {/* Preview */}
      <div className="aspect-square bg-slate-50 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-50" />

        {/* Expression count badge */}
        {expressionCount > 1 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/90 text-slate-600 rounded-full shadow-sm">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {expressionCount} forms
            </span>
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
          {sanitizedSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
              className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&_[id^=grid3d]]:hidden [&_[id^=pane3d]]:hidden [&_[id^=axis3d]]:hidden [&_[id^=line2d]]:hidden [&_[id^=xtick]]:hidden [&_[id^=text]]:hidden [&_[id^=Line3D]]:hidden"
            />
          ) : !imageError ? (
            <img
              src={`/crystals/${family.id}.svg`}
              alt={family.name}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
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
            {family.name}
          </h3>
          <Badge variant={systemColors[family.crystal_system?.toLowerCase()] || 'default'}>
            {family.crystal_system}
          </Badge>
        </div>
        {(family.chemistry || hardnessDisplay) && (
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            {family.chemistry && <span>{family.chemistry}</span>}
            {hardnessDisplay && <span>H: {hardnessDisplay}</span>}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
