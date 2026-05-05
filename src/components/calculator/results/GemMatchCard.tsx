/**
 * Detailed gem match card with property information.
 * Shows comprehensive gem data for more detailed lookup results.
 */

import { cn } from '../../ui/cn';
import type { GemReference } from '../../../lib/calculator/conversions';

interface GemMatchCardProps {
  /** The gem data */
  gem: GemReference;
  /** Which property was used for matching (for highlighting) */
  matchedProperty?: 'ri' | 'sg' | 'birefringence' | 'dispersion';
  /** Additional class names */
  className?: string;
}

/**
 * Format a numeric or range value for display.
 */
function formatValue(
  value: number | [number, number] | undefined,
  decimals: number
): string {
  if (value === undefined) return '—';
  if (Array.isArray(value)) {
    return `${value[0].toFixed(decimals)}-${value[1].toFixed(decimals)}`;
  }
  return value.toFixed(decimals);
}

export function GemMatchCard({
  gem,
  matchedProperty,
  className,
}: GemMatchCardProps) {
  const properties = [
    { key: 'ri', label: 'RI', value: formatValue(gem.ri, 3), matched: matchedProperty === 'ri' },
    { key: 'sg', label: 'SG', value: formatValue(gem.sg, 2), matched: matchedProperty === 'sg' },
    {
      key: 'birefringence',
      label: 'Biref.',
      value: gem.birefringence !== undefined ? formatValue(gem.birefringence, 3) : '—',
      matched: matchedProperty === 'birefringence',
    },
    {
      key: 'dispersion',
      label: 'Disp.',
      value: gem.dispersion !== undefined ? formatValue(gem.dispersion, 3) : '—',
      matched: matchedProperty === 'dispersion',
    },
    { key: 'hardness', label: 'Mohs', value: gem.hardness || '—', matched: false },
  ];

  return (
    <div
      className={cn(
        'p-3 rounded-lg bg-white border border-slate-200',
        'hover:border-crystal-300 hover:shadow-sm transition-all',
        className
      )}
    >
      {/* Gem name + origin badge */}
      <h4 className="font-medium text-slate-900 mb-2">
        {gem.name}
        {gem.origin && gem.origin !== 'natural' && (
          <span className={cn(
            'ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded-full border',
            gem.origin === 'synthetic' && 'bg-blue-100 text-blue-700 border-blue-200',
            gem.origin === 'simulant' && 'bg-amber-100 text-amber-700 border-amber-200',
            gem.origin === 'composite' && 'bg-slate-100 text-slate-600 border-slate-300',
          )}>
            {gem.origin}
          </span>
        )}
      </h4>

      {/* Properties grid */}
      <div className="grid grid-cols-5 gap-1 text-xs">
        {properties.map((prop) => (
          <div
            key={prop.key}
            className={cn(
              'text-center p-1 rounded',
              prop.matched && 'bg-crystal-100'
            )}
          >
            <p className="text-slate-600">{prop.label}</p>
            <p
              className={cn(
                'font-medium',
                prop.matched ? 'text-crystal-700' : 'text-slate-700'
              )}
            >
              {prop.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
