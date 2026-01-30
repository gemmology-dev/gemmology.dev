/**
 * Hook for multi-criteria gem identification.
 * Allows users to input multiple properties and find matching gems.
 *
 * @example
 * ```tsx
 * const { findMatches, crystalSystems, loading, mineralsCount } = useGemIdentification();
 *
 * const results = findMatches({
 *   ri: 1.544,
 *   sg: 2.65,
 *   crystalSystem: 'Trigonal',
 * }, tolerances);
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllMinerals, getCrystalSystems, type Mineral } from '../lib/db';
import {
  findMatches as calculateMatches,
  type IdentificationCriteria,
  type ToleranceSettings,
  type MatchResult,
  DEFAULT_TOLERANCES,
} from '../lib/identification/match-calculator';

interface UseGemIdentificationReturn {
  /** Find matching minerals for given criteria */
  findMatches: (criteria: IdentificationCriteria, tolerances?: Partial<ToleranceSettings>) => MatchResult[];
  /** Available crystal systems for dropdown */
  crystalSystems: string[];
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if data loading failed */
  error: string | null;
  /** Number of minerals in the database */
  mineralsCount: number;
  /** Whether database is available */
  dbAvailable: boolean;
}

export function useGemIdentification(): UseGemIdentificationReturn {
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [crystalSystems, setCrystalSystems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbAvailable, setDbAvailable] = useState(false);

  // Load minerals and crystal systems on mount
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [mineralsData, systemsData] = await Promise.all([
          getAllMinerals(),
          getCrystalSystems(),
        ]);

        if (!mounted) return;

        setMinerals(mineralsData);
        setCrystalSystems(systemsData);
        setDbAvailable(mineralsData.length > 0);
      } catch (err) {
        if (!mounted) return;

        console.warn('Failed to load identification data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setDbAvailable(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Memoized find function
  const findMatches = useCallback(
    (criteria: IdentificationCriteria, customTolerances?: Partial<ToleranceSettings>): MatchResult[] => {
      if (minerals.length === 0) return [];

      const tolerances: ToleranceSettings = {
        ...DEFAULT_TOLERANCES,
        ...customTolerances,
      };

      return calculateMatches(minerals, criteria, tolerances);
    },
    [minerals]
  );

  const mineralsCount = useMemo(() => minerals.length, [minerals]);

  return {
    findMatches,
    crystalSystems,
    loading,
    error,
    mineralsCount,
    dbAvailable,
  };
}

export type { IdentificationCriteria, ToleranceSettings, MatchResult };
export { DEFAULT_TOLERANCES } from '../lib/identification/match-calculator';
