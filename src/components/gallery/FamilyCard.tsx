import { useState } from 'react';
import { Badge } from '../ui';
import { cn } from '../ui/cn';
import type { MineralFamily, MineralExpression } from '../../lib/db';

// Crystal system color mapping for badges
const SYSTEM_COLORS: Record<string, 'cubic' | 'hexagonal' | 'trigonal' | 'tetragonal' | 'orthorhombic' | 'monoclinic' | 'triclinic' | 'default'> = {
  cubic: 'cubic',
  hexagonal: 'hexagonal',
  trigonal: 'trigonal',
  tetragonal: 'tetragonal',
  orthorhombic: 'orthorhombic',
  monoclinic: 'monoclinic',
  triclinic: 'triclinic',
};

interface FamilyCardProps {
  family: MineralFamily;
  expressions?: MineralExpression[];
  onClick?: () => void;
  href?: string;
}

/**
 * Gallery card showing mineral families with expression indicators.
 * Displays the primary crystal form with a badge showing total expression count.
 */
export function FamilyCard({ family, expressions = [], onClick, href }: FamilyCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const systemColor = SYSTEM_COLORS[family.crystal_system.toLowerCase()] || 'default';
  const primaryExpression = expressions.find(e => e.is_primary) || expressions[0];
  const expressionCount = family.expressionCount || expressions.length;

  // Get SVG content - prefer inline, then path-based
  const svgContent = primaryExpression?.model_svg || family.primarySvg;
  const svgPath = !svgContent && primaryExpression ? `/crystals/${primaryExpression.id}.svg` : null;

  const CardWrapper = href ? 'a' : 'article';
  const cardProps = href ? { href } : {};

  const formatHardness = () => {
    if (!family.hardness_min) return null;
    if (family.hardness_min === family.hardness_max) {
      return family.hardness_min;
    }
    return `${family.hardness_min}-${family.hardness_max}`;
  };

  const formatSG = () => {
    if (!family.sg_min) return null;
    if (family.sg_min === family.sg_max) {
      return family.sg_min.toFixed(2);
    }
    return `${family.sg_min.toFixed(2)}-${family.sg_max?.toFixed(2)}`;
  };

  const formatRI = () => {
    if (!family.ri_min) return null;
    if (family.ri_min === family.ri_max) {
      return family.ri_min.toFixed(3);
    }
    return `${family.ri_min.toFixed(3)}-${family.ri_max?.toFixed(3)}`;
  };

  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        'group relative rounded-xl border border-slate-200 bg-white overflow-hidden',
        'transition-all duration-300 hover:border-slate-300 hover:shadow-lg',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Crystal Preview */}
      <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 p-4 relative overflow-hidden">
        {svgContent ? (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : svgPath && !imageError ? (
          <img
            src={svgPath}
            alt={family.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CrystalPlaceholder system={family.crystal_system} />
          </div>
        )}

        {/* Expression Count Badge */}
        {expressionCount > 1 && (
          <div className={cn(
            'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold',
            'bg-white/90 backdrop-blur-sm shadow-sm border border-slate-200',
            'flex items-center gap-1.5'
          )}>
            <CrystalIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700">{expressionCount} forms</span>
          </div>
        )}

        {/* Hover: Expression Thumbnails */}
        {expressionCount > 1 && isHovered && expressions.length > 0 && (
          <div className={cn(
            'absolute bottom-0 left-0 right-0 p-3',
            'bg-gradient-to-t from-black/60 to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )}>
            <div className="flex gap-1.5 justify-center">
              {expressions.slice(0, 5).map((expr) => (
                <div
                  key={expr.id}
                  className={cn(
                    'w-8 h-8 rounded-md bg-white/90 p-1',
                    'border-2 transition-colors',
                    expr.is_primary ? 'border-blue-400' : 'border-transparent'
                  )}
                  title={expr.name}
                >
                  {expr.model_svg ? (
                    <div
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: expr.model_svg }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 rounded" />
                  )}
                </div>
              ))}
              {expressionCount > 5 && (
                <div className="w-8 h-8 rounded-md bg-white/70 flex items-center justify-center text-xs font-medium text-slate-600">
                  +{expressionCount - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
            {family.name}
          </h3>
          <Badge variant={systemColor} size="sm">
            {family.crystal_system}
          </Badge>
        </div>

        {family.chemistry && (
          <p className="text-sm text-slate-500 font-mono mb-3">{family.chemistry}</p>
        )}

        {/* Compact Properties */}
        <div className="flex gap-4 text-xs text-slate-600">
          {formatHardness() && (
            <span className="flex items-center gap-1" title="Mohs Hardness">
              <span className="text-amber-500">H</span>
              {formatHardness()}
            </span>
          )}
          {formatSG() && (
            <span className="flex items-center gap-1" title="Specific Gravity">
              <span className="text-blue-500">SG</span>
              {formatSG()}
            </span>
          )}
          {formatRI() && (
            <span className="flex items-center gap-1" title="Refractive Index">
              <span className="text-cyan-500">RI</span>
              {formatRI()}
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}

/**
 * Placeholder icon when no crystal SVG is available.
 */
function CrystalPlaceholder({ system }: { system: string }) {
  return (
    <svg
      className="w-24 h-24 text-slate-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2L2 7l10 5 10-5-10-5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 17l10 5 10-5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12l10 5 10-5"
      />
    </svg>
  );
}

/**
 * Small crystal icon for the expression count badge.
 */
function CrystalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export default FamilyCard;
