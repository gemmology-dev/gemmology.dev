/**
 * Compact gem match display as pill badges.
 * Used for showing matching gemstones in a space-efficient manner.
 */

import { cn } from '../../ui/cn';

interface GemMatch {
  /** Gem name */
  name: string;
  /** Optional property value to display (e.g., "3.52" for SG) */
  propertyValue?: string;
  /** Origin classification (natural, synthetic, simulant, composite) */
  origin?: string;
}

const originBadgeStyles: Record<string, string> = {
  synthetic: 'bg-blue-100 text-blue-700 border-blue-200',
  simulant: 'bg-amber-100 text-amber-700 border-amber-200',
  composite: 'bg-slate-100 text-slate-600 border-slate-300',
};

interface GemMatchBadgesProps {
  /** Array of matching gems */
  matches: GemMatch[];
  /** Label shown above the badges */
  label?: string;
  /** Message when no matches found */
  emptyMessage?: string;
  /** Maximum number of badges to show (rest shown as "+N more") */
  maxVisible?: number;
  /** Additional class names */
  className?: string;
}

export function GemMatchBadges({
  matches,
  label = 'Possible Matches',
  emptyMessage = 'No matches found.',
  maxVisible = 10,
  className,
}: GemMatchBadgesProps) {
  const visibleMatches = matches.slice(0, maxVisible);
  const hiddenCount = matches.length - maxVisible;

  return (
    <div className={cn('border-t border-crystal-200 pt-4 mt-4', className)}>
      {matches.length > 0 ? (
        <>
          {label && (
            <p className="text-sm font-medium text-slate-700 mb-2">{label}:</p>
          )}
          <div className="flex flex-wrap gap-2">
            {visibleMatches.map((gem) => (
              <span
                key={gem.name}
                className="px-2 py-1 text-xs font-medium rounded-full bg-white text-slate-700 border border-slate-200"
              >
                {gem.name}
                {gem.origin && gem.origin !== 'natural' && (
                  <span className={cn(
                    'ml-1 px-1.5 py-0.5 text-[10px] rounded-full border',
                    originBadgeStyles[gem.origin] || 'bg-slate-100 text-slate-600 border-slate-300'
                  )}>
                    {gem.origin}
                  </span>
                )}
                {gem.propertyValue && (
                  <span className="text-slate-600 ml-1">({gem.propertyValue})</span>
                )}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                +{hiddenCount} more
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      )}
    </div>
  );
}
