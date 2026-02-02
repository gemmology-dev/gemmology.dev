/**
 * Pagination component for navigating through paginated data.
 * Provides a consistent UX across all table components.
 */

import { cn } from './cn';
import { getPageNumbers, PAGE_SIZE_OPTIONS } from '../../lib/pagination';
import type { PaginatedResult } from '../../lib/pagination';

interface PaginationProps {
  pagination: PaginatedResult<unknown>['pagination'];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSize?: boolean;
  compact?: boolean;
  className?: string;
}

export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  compact = false,
  className,
}: PaginationProps) {
  const { page, pageSize, total, totalPages, hasNext, hasPrev } = pagination;

  if (total === 0) return null;

  const pageNumbers = getPageNumbers(page, totalPages, compact ? 5 : 7);

  // Calculate range of items being shown
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 py-3',
        className
      )}
    >
      {/* Info text */}
      <div className="text-sm text-slate-600">
        Showing <span className="font-medium">{startItem}</span>–
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{total}</span>
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className={cn(
            'px-2 py-1 text-sm rounded border transition-colors',
            hasPrev
              ? 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              : 'border-slate-200 text-slate-400 cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page numbers */}
        {!compact && (
          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers.map((pageNum, i) =>
              pageNum === 'ellipsis' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 py-1 text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'min-w-[32px] px-2 py-1 text-sm rounded border transition-colors',
                    pageNum === page
                      ? 'border-crystal-500 bg-crystal-500 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                  )}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>
        )}

        {/* Mobile page indicator */}
        <span className="sm:hidden px-2 text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className={cn(
            'px-2 py-1 text-sm rounded border transition-colors',
            hasNext
              ? 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              : 'border-slate-200 text-slate-400 cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-slate-600">
            Per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-crystal-400"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Compact pagination for smaller spaces (e.g., within cards).
 */
export function PaginationCompact({
  pagination,
  onPageChange,
  className,
}: Omit<PaginationProps, 'showPageSize' | 'onPageSizeChange' | 'compact'>) {
  const { page, total, totalPages, hasNext, hasPrev } = pagination;

  if (total === 0) return null;

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className={cn(
          'p-1 rounded transition-colors',
          hasPrev
            ? 'text-slate-600 hover:bg-slate-100'
            : 'text-slate-300 cursor-not-allowed'
        )}
        aria-label="Previous page"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <span className="text-sm text-slate-600">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className={cn(
          'p-1 rounded transition-colors',
          hasNext
            ? 'text-slate-600 hover:bg-slate-100'
            : 'text-slate-300 cursor-not-allowed'
        )}
        aria-label="Next page"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
