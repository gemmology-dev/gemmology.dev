/**
 * Hook to load calculator reference data from the database.
 * Provides fallback to hardcoded constants if database is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  findFamiliesByRI,
  findFamiliesBySG,
  getCutShapeFactors,
  getThresholds,
  getMineralsWithHeatTreatment,
  getMineralsWithSG,
  getMineralsWithDispersion,
  getMineralsWithHardness,
  getMineralsForRefractometer,
  getMineralsWithPleochroism,
  type Mineral,
  type MineralFamily,
  type CutShapeFactor,
  type GemmologicalThreshold,
} from '../lib/db';
import {
  COMMON_GEMS,
  SHAPE_FACTORS,
  type GemReference,
} from '../lib/calculator/conversions';

// Helper to ensure numeric values (database may return strings or null)
function toNumber(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? undefined : num;
}

// Convert Mineral to GemReference format for compatibility
function mineralToGemRef(mineral: Mineral): GemReference {
  return {
    name: mineral.name,
    ri: mineral.ri_min && mineral.ri_max
      ? mineral.ri_min === mineral.ri_max
        ? mineral.ri_min
        : [mineral.ri_min, mineral.ri_max]
      : 0,
    sg: mineral.sg_min && mineral.sg_max
      ? mineral.sg_min === mineral.sg_max
        ? mineral.sg_min
        : [mineral.sg_min, mineral.sg_max]
      : 0,
    birefringence: toNumber(mineral.birefringence),
    dispersion: toNumber(mineral.dispersion),
    hardness: mineral.hardness ?? '',
  };
}

// Convert MineralFamily to GemReference format (no duplicates)
function familyToGemRef(family: MineralFamily): GemReference {
  // Format hardness as string range
  const formatHardness = (): string => {
    if (!family.hardness_min) return '';
    if (family.hardness_min === family.hardness_max) {
      return String(family.hardness_min);
    }
    return `${family.hardness_min}-${family.hardness_max}`;
  };

  return {
    name: family.name,
    ri: family.ri_min && family.ri_max
      ? family.ri_min === family.ri_max
        ? family.ri_min
        : [family.ri_min, family.ri_max]
      : 0,
    sg: family.sg_min && family.sg_max
      ? family.sg_min === family.sg_max
        ? family.sg_min
        : [family.sg_min, family.sg_max]
      : 0,
    birefringence: toNumber(family.birefringence),
    dispersion: toNumber(family.dispersion),
    hardness: formatHardness(),
  };
}

interface UseCalculatorDataReturn {
  // Data loading state
  loading: boolean;
  error: string | null;
  dbAvailable: boolean;

  // RI/SG lookup functions
  findByRI: (ri: number, tolerance?: number) => Promise<GemReference[]>;
  findBySG: (sg: number, tolerance?: number) => Promise<GemReference[]>;

  // Reference data
  shapeFactors: CutShapeFactor[];
  thresholds: Record<string, GemmologicalThreshold[]>;
  heatTreatableGems: Mineral[];
  mineralsWithSG: Mineral[];
  mineralsWithDispersion: Mineral[];
  mineralsWithHardness: Mineral[];
  mineralsForRefractometer: Mineral[];
  mineralsWithPleochroism: Mineral[];

  // Fallback data
  fallbackGems: GemReference[];
  fallbackShapeFactors: typeof SHAPE_FACTORS;
}

/**
 * Hook to access calculator reference data with database integration.
 */
export function useCalculatorData(): UseCalculatorDataReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbAvailable, setDbAvailable] = useState(false);

  // Reference data state
  const [shapeFactors, setShapeFactors] = useState<CutShapeFactor[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, GemmologicalThreshold[]>>({});
  const [heatTreatableGems, setHeatTreatableGems] = useState<Mineral[]>([]);
  const [mineralsWithSG, setMineralsWithSG] = useState<Mineral[]>([]);
  const [mineralsWithDispersion, setMineralsWithDispersion] = useState<Mineral[]>([]);
  const [mineralsWithHardness, setMineralsWithHardness] = useState<Mineral[]>([]);
  const [mineralsForRefractometer, setMineralsForRefractometer] = useState<Mineral[]>([]);
  const [mineralsWithPleochroism, setMineralsWithPleochroism] = useState<Mineral[]>([]);

  // Load reference data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Try to load data from database
        const [shapes, biref, disp, critAngle, heatGems, sgMinerals, dispMinerals, hardMinerals, refractMinerals, pleochroicMinerals] = await Promise.all([
          getCutShapeFactors(),
          getThresholds('birefringence'),
          getThresholds('dispersion'),
          getThresholds('critical_angle'),
          getMineralsWithHeatTreatment(),
          getMineralsWithSG(),
          getMineralsWithDispersion(),
          getMineralsWithHardness(),
          getMineralsForRefractometer(),
          getMineralsWithPleochroism(),
        ]);

        // If we got shape factors, database is available
        if (shapes.length > 0) {
          setDbAvailable(true);
          setShapeFactors(shapes);
          setThresholds({
            birefringence: biref,
            dispersion: disp,
            critical_angle: critAngle,
          });
          setHeatTreatableGems(heatGems);
          setMineralsWithSG(sgMinerals);
          setMineralsWithDispersion(dispMinerals);
          setMineralsWithHardness(hardMinerals);
          setMineralsForRefractometer(refractMinerals);
          setMineralsWithPleochroism(pleochroicMinerals);
        } else {
          // Database may not have reference tables yet
          setDbAvailable(false);
        }
      } catch (err) {
        console.warn('Calculator data: Database not available, using fallbacks', err);
        setError(err instanceof Error ? err.message : 'Failed to load database');
        setDbAvailable(false);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // RI lookup with database or fallback (uses families to avoid duplicates)
  const findByRI = useCallback(async (ri: number, tolerance: number = 0.01): Promise<GemReference[]> => {
    if (dbAvailable) {
      try {
        // Use family-based query to avoid duplicate entries like
        // fluorite, fluorite-octahedron, fluorite-twin showing separately
        const families = await findFamiliesByRI(ri, tolerance);
        return families.map(familyToGemRef);
      } catch (err) {
        console.warn('DB RI lookup failed, using fallback', err);
      }
    }
    // Fallback to hardcoded
    return COMMON_GEMS.filter(gem => {
      if (Array.isArray(gem.ri)) {
        return ri >= gem.ri[0] - tolerance && ri <= gem.ri[1] + tolerance;
      }
      return Math.abs(gem.ri - ri) <= tolerance;
    });
  }, [dbAvailable]);

  // SG lookup with database or fallback (uses families to avoid duplicates)
  const findBySG = useCallback(async (sg: number, tolerance: number = 0.05): Promise<GemReference[]> => {
    if (dbAvailable) {
      try {
        // Use family-based query to avoid duplicate entries like
        // fluorite, fluorite-octahedron, fluorite-twin showing separately
        const families = await findFamiliesBySG(sg, tolerance);
        return families.map(familyToGemRef);
      } catch (err) {
        console.warn('DB SG lookup failed, using fallback', err);
      }
    }
    // Fallback to hardcoded
    return COMMON_GEMS.filter(gem => {
      if (Array.isArray(gem.sg)) {
        return sg >= gem.sg[0] - tolerance && sg <= gem.sg[1] + tolerance;
      }
      return Math.abs(gem.sg - sg) <= tolerance;
    });
  }, [dbAvailable]);

  return {
    loading,
    error,
    dbAvailable,
    findByRI,
    findBySG,
    shapeFactors,
    thresholds,
    heatTreatableGems,
    mineralsWithSG,
    mineralsWithDispersion,
    mineralsWithHardness,
    mineralsForRefractometer,
    mineralsWithPleochroism,
    fallbackGems: COMMON_GEMS,
    fallbackShapeFactors: SHAPE_FACTORS,
  };
}
