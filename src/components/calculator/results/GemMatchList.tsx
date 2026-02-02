/**
 * Container for displaying multiple gem match cards.
 * Used when detailed property information is needed for each match.
 * Supports pagination for large result sets.
 */

import { useMemo } from 'react';
import { cn } from '../../ui/cn';
import { GemMatchCard } from './GemMatchCard';
import { Pagination } from '../../ui/Pagination';
import { usePagination } from '../../../hooks/usePagination';
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
  /** Items per page (default 10) */
  pageSize?: number;
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
  pageSize = 10,
  layout = 'list',
  className,
}: GemMatchListProps) {
  const { page, params, onPageChange, onPageSizeChange, resetPage } = usePagination({
    initialPageSize: pageSize,
  });

  // Reset to page 1 when gems array changes (new search results)
  useMemo(() => {
    resetPage();
  }, [gems.length, resetPage]);

  // Calculate pagination
  const totalPages = Math.ceil(gems.length / params.pageSize);
  const startIndex = (page - 1) * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const visibleGems = gems.slice(startIndex, endIndex);

  const pagination = {
    page,
    pageSize: params.pageSize,
    total: gems.length,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

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

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                showPageSize
              />
            </div>
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
