/**
 * Pagination utilities and types for consistent data handling across the application.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * Calculate pagination metadata from total count and current params.
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<never>['pagination'] {
  const totalPages = Math.ceil(total / pageSize);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * Calculate SQL LIMIT and OFFSET from pagination params.
 */
export function toSqlParams(params: PaginationParams): { limit: number; offset: number } {
  return {
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  };
}

/**
 * Generate page numbers to display in pagination UI.
 * Shows first, last, current, and surrounding pages with ellipsis.
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const sidePages = Math.floor((maxVisible - 3) / 2); // -3 for first, last, and current

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - sidePages);
  let rangeEnd = Math.min(totalPages - 1, currentPage + sidePages);

  // Adjust if near start or end
  if (currentPage <= sidePages + 2) {
    rangeEnd = Math.min(totalPages - 1, maxVisible - 2);
  } else if (currentPage >= totalPages - sidePages - 1) {
    rangeStart = Math.max(2, totalPages - maxVisible + 3);
  }

  // Add ellipsis before range if needed
  if (rangeStart > 2) {
    pages.push('ellipsis');
  }

  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis after range if needed
  if (rangeEnd < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
