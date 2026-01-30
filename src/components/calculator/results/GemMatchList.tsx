/**
 * Container for displaying multiple gem match cards.
 * Used when detailed property information is needed for each match.
 */

import { cn } from '../../ui/cn';
import { GemMatchCard } from './GemMatchCard';
import type { GemReference } from '../../../lib/calculator/conversions';

interface GemMatchListProps {
  /** Array of matching gems */
  gems: GemReference[];
  /** Which property was used for matching */
  matchedProperty?: 'ri' | 'sg' | 'birefringence' | 'dispersion';
  /** Label shown above the list */
  label?: string;
  /** Message when no matches found */
  emptyMessage?: string;
  /** Maximum number of cards to show */
  maxVisible?: number;
  /** Layout mode */
  layout?: 'list' | 'grid';
  /** Additional class names */
  className?: string;
}

export function GemMatchList({
  gems,
  matchedProperty,
  label,
  emptyMessage = 'No matching gemstones found.',
  maxVisible = 20,
  layout = 'list',
  className,
}: GemMatchListProps) {
  const visibleGems = gems.slice(0, maxVisible);
  const hiddenCount = gems.length - maxVisible;

  return (
    <div className={className}>
      {label && (
        <h3 className="text-sm font-medium text-slate-700 mb-3">
          {label}
          {gems.length > 0 && (
            <span className="ml-2 text-slate-500 font-normal">
              ({gems.length} {gems.length === 1 ? 'match' : 'matches'})
            </span>
          )}
        </h3>
      )}

      {gems.length > 0 ? (
        <>
          <div
            className={cn(
              layout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                : 'space-y-2'
            )}
          >
            {visibleGems.map((gem) => (
              <GemMatchCard
                key={gem.name}
                gem={gem}
                matchedProperty={matchedProperty}
              />
            ))}
          </div>

          {hiddenCount > 0 && (
            <p className="text-sm text-slate-500 mt-3 text-center">
              +{hiddenCount} more matches not shown
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-lg">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
