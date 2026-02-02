import { useState, useEffect, useCallback } from 'react';
import { Badge } from '../ui';
import { cn } from '../ui/cn';
import { ExpressionSelector } from './ExpressionSelector';
import type { MineralFamily, MineralExpression } from '../../lib/db';

// Crystal system color mapping
const SYSTEM_COLORS: Record<string, 'cubic' | 'hexagonal' | 'trigonal' | 'tetragonal' | 'orthorhombic' | 'monoclinic' | 'triclinic' | 'default'> = {
  cubic: 'cubic',
  hexagonal: 'hexagonal',
  trigonal: 'trigonal',
  tetragonal: 'tetragonal',
  orthorhombic: 'orthorhombic',
  monoclinic: 'monoclinic',
  triclinic: 'triclinic',
};

interface FamilyDetailProps {
  family: MineralFamily;
  expressions: MineralExpression[];
  initialExpression?: string;
}

/**
 * Full page layout for viewing a mineral family with its expressions.
 * Features a 3D/SVG viewer, expression selector, and property tables.
 */
export function FamilyDetail({ family, expressions, initialExpression }: FamilyDetailProps) {
  // Find initial expression
  const primaryExpr = expressions.find(e => e.is_primary) || expressions[0];
  const initialId = initialExpression
    ? expressions.find(e => e.slug === initialExpression || e.id === initialExpression)?.id
    : primaryExpr?.id;

  const [selectedId, setSelectedId] = useState(initialId || '');
  const selected = expressions.find(e => e.id === selectedId);

  const systemColor = SYSTEM_COLORS[family.crystal_system.toLowerCase()] || 'default';

  // Update URL when expression changes (without navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (selected && !selected.is_primary && selected.slug !== 'default') {
      url.searchParams.set('form', selected.slug);
    } else {
      url.searchParams.delete('form');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selected]);

  // Handle expression selection
  const handleSelectExpression = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Copy CDL to clipboard
  const handleCopyCDL = useCallback(() => {
    if (selected?.cdl) {
      navigator.clipboard.writeText(selected.cdl);
    }
  }, [selected]);

  // Format property helpers
  const formatHardness = () => {
    if (!family.hardness_min) return null;
    if (family.hardness_min === family.hardness_max) {
      return String(family.hardness_min);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left: Crystal Viewer */}
          <div className="space-y-4">
            {/* SVG Viewer */}
            <div className={cn(
              'aspect-square bg-white rounded-2xl shadow-lg overflow-hidden',
              'border border-slate-200 flex items-center justify-center p-8'
            )}>
              {selected?.model_svg ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: selected.model_svg }}
                />
              ) : (
                <div className="text-center text-slate-400">
                  <CrystalPlaceholder className="w-32 h-32 mx-auto mb-4" />
                  <p className="text-sm">No preview available</p>
                </div>
              )}
            </div>

            {/* Expression Selector */}
            {expressions.length > 1 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Crystal Forms ({expressions.length})
                </h3>
                <ExpressionSelector
                  expressions={expressions}
                  selected={selectedId}
                  onSelect={handleSelectExpression}
                />
              </div>
            )}

            {/* CDL Code */}
            {selected?.cdl && (
              <div className="bg-slate-900 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">CDL Expression</span>
                  <button
                    onClick={handleCopyCDL}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <code className="text-sm text-blue-300 font-mono break-all">
                  {selected.cdl}
                </code>
              </div>
            )}
          </div>

          {/* Right: Information */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={systemColor}>
                  {family.crystal_system}
                </Badge>
                {family.category && (
                  <Badge variant="outline">{family.category}</Badge>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {family.name}
              </h1>
              {selected && selected.name !== family.name && selected.slug !== 'default' && (
                <p className="text-xl text-slate-600">
                  {selected.name} form
                </p>
              )}
              {family.chemistry && (
                <p className="text-lg text-slate-500 font-mono mt-2">
                  {family.chemistry}
                </p>
              )}
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-3 gap-4">
              <QuickFact
                icon="H"
                iconColor="text-amber-500"
                label="Hardness"
                value={formatHardness()}
              />
              <QuickFact
                icon="SG"
                iconColor="text-blue-500"
                label="Specific Gravity"
                value={formatSG()}
              />
              <QuickFact
                icon="RI"
                iconColor="text-cyan-500"
                label="Refractive Index"
                value={formatRI()}
              />
            </div>

            {/* Expression-specific info */}
            {selected?.form_description && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  {selected.name} Form
                </h3>
                <p className="text-sm text-slate-600">{selected.form_description}</p>
                {selected.habit && (
                  <p className="text-xs text-slate-500 mt-2">
                    Habit: <span className="font-medium">{selected.habit}</span>
                  </p>
                )}
              </div>
            )}

            {/* Family Properties Table */}
            <PropertyTable title="Gemmological Properties">
              <PropertyRow label="Optical Character" value={family.optical_character} />
              <PropertyRow label="Lustre" value={family.lustre} />
              <PropertyRow label="Cleavage" value={family.cleavage} />
              <PropertyRow label="Fracture" value={family.fracture} />
              {family.birefringence && (
                <PropertyRow label="Birefringence" value={family.birefringence.toFixed(3)} />
              )}
              {family.dispersion && (
                <PropertyRow label="Dispersion" value={family.dispersion.toFixed(3)} />
              )}
              {family.pleochroism && (
                <PropertyRow label="Pleochroism" value={family.pleochroism} />
              )}
            </PropertyTable>

            {/* Notes */}
            {(family.notes || family.description) && (
              <div className="prose prose-slate prose-sm max-w-none">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Notes</h3>
                <p className="text-slate-600">{family.notes || family.description}</p>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-3">
              <a
                href={`/playground?preset=${selected?.id || family.id}`}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
                  'text-sm font-medium'
                )}
              >
                <PlayIcon className="w-4 h-4" />
                Open in Playground
              </a>
              {expressions.length > 1 && (
                <a
                  href={`/minerals/${family.id}`}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                    'border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors',
                    'text-sm font-medium'
                  )}
                >
                  <GridIcon className="w-4 h-4" />
                  All Forms
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function QuickFact({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('text-sm font-bold', iconColor)}>{icon}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function PropertyTable({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <h3 className="text-sm font-semibold text-slate-700 px-4 py-3 bg-slate-50 border-b border-slate-200">
        {title}
      </h3>
      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function PropertyRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function CrystalPlaceholder({ className }: { className?: string }) {
  return (
    <svg
      className={cn('text-slate-300', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l10 5 10-5" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export default FamilyDetail;
