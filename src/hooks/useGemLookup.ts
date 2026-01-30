/**
 * Hook for debounced gem matching against the database.
 * Provides automatic lookup with caching and loading states.
 *
 * @example
 * ```tsx
 * const { matches, loading, lookup } = useGemLookup({
 *   type: 'sg',
 *   tolerance: 0.05,
 *   debounce: 150
 * });
 *
 * useEffect(() => {
 *   lookup(result?.sg ?? null);
 * }, [result?.sg, lookup]);
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCalculatorData } from './useCalculatorData';
import type { GemReference } from '../lib/calculator/conversions';

type LookupType = 'ri' | 'sg';

interface UseGemLookupOptions {
  /** Type of property to search by */
  type: LookupType;
  /** Tolerance for matching (default: 0.01 for RI, 0.05 for SG) */
  tolerance?: number;
  /** Debounce delay in milliseconds (default: 150) */
  debounce?: number;
  /** Maximum number of results to return (default: unlimited) */
  maxResults?: number;
}

interface UseGemLookupReturn {
  /** Matching gems */
  matches: GemReference[];
  /** Whether a lookup is in progress */
  loading: boolean;
  /** Error message if lookup failed */
  error: string | null;
  /** Trigger a lookup for a value */
  lookup: (value: number | null) => void;
  /** Clear matches */
  clear: () => void;
  /** The value that was last looked up */
  lastValue: number | null;
}

const DEFAULT_TOLERANCES: Record<LookupType, number> = {
  ri: 0.01,
  sg: 0.05,
};

export function useGemLookup(options: UseGemLookupOptions): UseGemLookupReturn {
  const {
    type,
    tolerance = DEFAULT_TOLERANCES[type],
    debounce: debounceMs = 150,
    maxResults,
  } = options;

  const { findByRI, findBySG } = useCalculatorData();

  const [matches, setMatches] = useState<GemReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState<number | null>(null);

  // Refs for debouncing and cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Select the appropriate lookup function
  const lookupFn = type === 'ri' ? findByRI : findBySG;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const lookup = useCallback((value: number | null) => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Handle null/undefined values
    if (value === null || value === undefined || isNaN(value)) {
      setMatches([]);
      setLastValue(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLastValue(value);
    setLoading(true);

    // Debounce the actual lookup
    timeoutRef.current = setTimeout(async () => {
      // Create abort controller for this request
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const results = await lookupFn(value, tolerance);

        // Check if this request was aborted
        if (controller.signal.aborted) return;

        // Apply maxResults limit if specified
        const limitedResults = maxResults
          ? results.slice(0, maxResults)
          : results;

        setMatches(limitedResults);
        setError(null);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;

        console.warn(`Gem lookup failed for ${type}=${value}:`, err);
        setError(err instanceof Error ? err.message : 'Lookup failed');
        setMatches([]);
      } finally {
        // Only clear loading if this request wasn't aborted
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [lookupFn, tolerance, debounceMs, maxResults, type]);

  const clear = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setMatches([]);
    setLastValue(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    matches,
    loading,
    error,
    lookup,
    clear,
    lastValue,
  };
}

/**
 * Format a gem's RI value for display.
 */
export function formatRI(ri: number | [number, number]): string {
  if (Array.isArray(ri)) {
    return `${ri[0].toFixed(3)}-${ri[1].toFixed(3)}`;
  }
  return ri.toFixed(3);
}

/**
 * Format a gem's SG value for display.
 */
export function formatSG(sg: number | [number, number]): string {
  if (Array.isArray(sg)) {
    return `${sg[0].toFixed(2)}-${sg[1].toFixed(2)}`;
  }
  return sg.toFixed(2);
}
