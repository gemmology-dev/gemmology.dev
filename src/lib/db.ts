import type { Database, SqlJsStatic } from 'sql.js';
import {
  type PaginationParams,
  type PaginatedResult,
  calculatePagination,
  toSqlParams,
  DEFAULT_PAGE_SIZE,
} from './pagination';

// sql.js needs to be loaded via script tag to work properly with WASM
type InitSqlJs = (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>;

declare global {
  interface Window {
    initSqlJs?: InitSqlJs;
  }
}

let sqlJsLoadPromise: Promise<InitSqlJs> | null = null;

async function getInitSqlJs(): Promise<InitSqlJs> {
  // Return cached if already loaded
  if (window.initSqlJs) {
    return window.initSqlJs;
  }

  // Only load once
  if (sqlJsLoadPromise) {
    return sqlJsLoadPromise;
  }

  sqlJsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/sql.js/sql-wasm.js';
    script.onload = () => {
      if (window.initSqlJs) {
        resolve(window.initSqlJs);
      } else {
        reject(new Error('initSqlJs not found after script load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load sql.js'));
    document.head.appendChild(script);
  });

  return sqlJsLoadPromise;
}

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export interface Mineral {
  id: string;
  name: string;
  system: string;
  cdl: string;
  point_group: string;
  chemistry: string;
  hardness?: string;
  description?: string;
  sg?: string;
  ri?: string;
  birefringence?: number;
  optical_character?: string;
  dispersion?: number;
  lustre?: string;
  cleavage?: string;
  fracture?: string;
  pleochroism?: string;
  // Structured pleochroism data for dichroscope lookup
  pleochroism_strength?: string;  // 'none'|'weak'|'moderate'|'strong'|'very_strong'
  pleochroism_color1?: string;
  pleochroism_color2?: string;
  pleochroism_color3?: string;    // For trichroic gems
  pleochroism_notes?: string;
  twin_law?: string;
  phenomenon?: string;
  note?: string;
  localities_json?: string;
  forms_json?: string;
  colors_json?: string;
  treatments_json?: string;
  inclusions_json?: string;
  // Pre-generated 3D models
  model_svg?: string;
  model_stl?: Uint8Array;
  model_gltf?: string;
  models_generated_at?: string;
  // Calculator-optimized numeric columns
  ri_min?: number;
  ri_max?: number;
  sg_min?: number;
  sg_max?: number;
  // Heat treatment temperatures (Celsius)
  heat_treatment_temp_min?: number;
  heat_treatment_temp_max?: number;
}

// Reference table types
export interface CutShapeFactor {
  id: string;
  name: string;
  factor: number;
  description?: string;
}

export interface VolumeShapeFactor {
  id: string;
  name: string;
  factor: number;
}

export interface GemmologicalThreshold {
  category: string;
  level: string;
  min_value?: number;
  max_value?: number;
  description?: string;
}

// =============================================================================
// Family + Expression Types (normalized structure)
// =============================================================================

/**
 * A mineral family with shared gemmological properties.
 * Families group multiple crystal expressions that share identical properties
 * but have different crystal morphologies.
 */
export interface MineralFamily {
  id: string;
  name: string;
  crystal_system: string;
  point_group?: string;
  chemistry?: string;
  category?: string;

  // Physical properties
  hardness_min?: number;
  hardness_max?: number;
  sg_min?: number;
  sg_max?: number;

  // Optical properties
  ri_min?: number;
  ri_max?: number;
  birefringence?: number;
  dispersion?: number;
  optical_character?: string;
  pleochroism?: string;
  pleochroism_strength?: string;
  pleochroism_color1?: string;
  pleochroism_color2?: string;
  pleochroism_color3?: string;
  pleochroism_notes?: string;

  // Physical characteristics
  lustre?: string;
  cleavage?: string;
  fracture?: string;

  // Educational content
  description?: string;
  notes?: string;
  diagnostic_features?: string;
  common_inclusions?: string;

  // JSON arrays (stored as strings, need parsing)
  localities_json?: string;
  colors_json?: string;
  treatments_json?: string;
  inclusions_json?: string;
  forms_json?: string;

  // Heat treatment
  heat_treatment_temp_min?: number;
  heat_treatment_temp_max?: number;

  // Special properties
  twin_law?: string;
  phenomenon?: string;
  fluorescence?: string;

  // Computed fields (populated by JOIN queries)
  expressionCount?: number;
  primarySvg?: string;
}

/**
 * A crystal morphology expression within a mineral family.
 * Expressions represent different crystal habits or forms of the same mineral.
 */
export interface MineralExpression {
  id: string;
  family_id: string;
  name: string;
  slug: string;
  cdl: string;
  point_group?: string;
  form_description?: string;
  habit?: string;
  forms_json?: string;

  // Visual assets
  svg_path?: string;
  gltf_path?: string;
  stl_path?: string;
  thumbnail_path?: string;

  // Inline model data
  model_svg?: string;
  model_stl?: Uint8Array;
  model_gltf?: string;
  models_generated_at?: string;

  // Metadata
  is_primary: boolean;
  sort_order: number;
  note?: string;
}

/**
 * A family with its expressions pre-loaded.
 */
export interface MineralFamilyWithExpressions extends MineralFamily {
  expressions: MineralExpression[];
}

export async function getDB(): Promise<Database> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const initSqlJs = await getInitSqlJs();
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/sql.js/${file}`,
    });

    const response = await fetch('/minerals.db');
    if (!response.ok) {
      throw new Error(`Failed to load database: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
    return db;
  })();

  return dbPromise;
}

export async function getAllMinerals(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(`
    SELECT id, name, system, cdl, point_group, chemistry, hardness, description,
           sg, ri, birefringence, optical_character, dispersion, lustre, cleavage,
           fracture, pleochroism, twin_law, phenomenon, note, model_svg,
           ri_min, ri_max, sg_min, sg_max
    FROM minerals
    ORDER BY name ASC
  `);

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

export async function getMineralByName(name: string): Promise<Mineral | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals WHERE name = ? LIMIT 1`,
    [name]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const mineral: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    mineral[col] = row[i];
  });
  return mineral as Mineral;
}

export async function searchMinerals(query: string): Promise<Mineral[]> {
  const database = await getDB();
  const searchTerm = `%${query.toLowerCase()}%`;

  const result = database.exec(
    `SELECT * FROM minerals
     WHERE LOWER(name) LIKE ?
        OR LOWER(chemistry) LIKE ?
        OR LOWER(system) LIKE ?
        OR LOWER(description) LIKE ?
     ORDER BY
       CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END,
       name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

export async function getMineralsBySystem(system: string): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals WHERE LOWER(system) = ? ORDER BY name ASC`,
    [system.toLowerCase()]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

export async function getMineralsByCategory(_category: string): Promise<Mineral[]> {
  // Category column doesn't exist in the database - return all minerals
  return getAllMinerals();
}

export async function getCrystalSystems(): Promise<string[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT DISTINCT system FROM minerals WHERE system IS NOT NULL ORDER BY system`
  );

  if (result.length === 0) return [];
  return result[0].values.map((row) => row[0] as string);
}

export async function getCategories(): Promise<string[]> {
  // Category column doesn't exist in the database
  return [];
}

// Pre-generated model query functions

export async function getModelSVG(mineralId: string): Promise<string | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT model_svg FROM minerals WHERE id = ? OR LOWER(name) = ?`,
    [mineralId.toLowerCase(), mineralId.toLowerCase()]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;
  return result[0].values[0][0] as string | null;
}

export async function getModelSTL(mineralId: string): Promise<Blob | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT model_stl FROM minerals WHERE id = ? OR LOWER(name) = ?`,
    [mineralId.toLowerCase(), mineralId.toLowerCase()]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;
  const stlData = result[0].values[0][0];
  if (!stlData) return null;

  // Convert to Blob for download
  return new Blob([stlData as Uint8Array], { type: 'application/sla' });
}

export async function getModelGLTF(mineralId: string): Promise<object | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT model_gltf FROM minerals WHERE id = ? OR LOWER(name) = ?`,
    [mineralId.toLowerCase(), mineralId.toLowerCase()]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;
  const gltfStr = result[0].values[0][0] as string | null;
  if (!gltfStr) return null;

  try {
    return JSON.parse(gltfStr);
  } catch {
    return null;
  }
}

export async function getMineralWithModels(mineralId: string): Promise<Mineral | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals WHERE id = ? OR LOWER(name) = ? LIMIT 1`,
    [mineralId.toLowerCase(), mineralId.toLowerCase()]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const mineral: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    mineral[col] = row[i];
  });
  return mineral as Mineral;
}

// =============================================================================
// Calculator-optimized query functions
// =============================================================================

/**
 * Find minerals matching an RI value within tolerance.
 * Uses numeric ri_min/ri_max columns for efficient searching.
 */
export async function findMineralsByRI(ri: number, tolerance: number = 0.01): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals
     WHERE ri_min IS NOT NULL AND ri_max IS NOT NULL
       AND (ri_min - ? <= ? AND ri_max + ? >= ?)
     ORDER BY ABS((ri_min + ri_max) / 2 - ?) ASC
     LIMIT 20`,
    [tolerance, ri, tolerance, ri, ri]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Find minerals matching an SG value within tolerance.
 * Uses numeric sg_min/sg_max columns for efficient searching.
 */
export async function findMineralsBySG(sg: number, tolerance: number = 0.05): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals
     WHERE sg_min IS NOT NULL AND sg_max IS NOT NULL
       AND (sg_min - ? <= ? AND sg_max + ? >= ?)
     ORDER BY ABS((sg_min + sg_max) / 2 - ?) ASC
     LIMIT 20`,
    [tolerance, sg, tolerance, sg, sg]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Get all cut shape factors for carat estimation.
 */
export async function getCutShapeFactors(): Promise<CutShapeFactor[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, factor, description FROM cut_shape_factors ORDER BY name`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const factor: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      factor[col] = row[i];
    });
    return factor as CutShapeFactor;
  });
}

/**
 * Get all volume shape factors for rough estimation.
 */
export async function getVolumeShapeFactors(): Promise<VolumeShapeFactor[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, factor FROM volume_shape_factors ORDER BY name`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const factor: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      factor[col] = row[i];
    });
    return factor as VolumeShapeFactor;
  });
}

/**
 * Get classification thresholds for a category.
 */
export async function getThresholds(category: string): Promise<GemmologicalThreshold[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT category, level, min_value, max_value, description
     FROM gemmological_thresholds
     WHERE category = ?
     ORDER BY COALESCE(min_value, -999999)`,
    [category]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const threshold: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      threshold[col] = row[i];
    });
    return threshold as GemmologicalThreshold;
  });
}

/**
 * Classify a value based on gemmological thresholds.
 */
export async function classifyValue(category: string, value: number): Promise<string | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT level FROM gemmological_thresholds
     WHERE category = ?
       AND (min_value IS NULL OR min_value <= ?)
       AND (max_value IS NULL OR max_value > ?)
     LIMIT 1`,
    [category, value, value]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;
  return result[0].values[0][0] as string;
}

/**
 * Get minerals with heat treatment temperature data.
 */
export async function getMineralsWithHeatTreatment(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals
     WHERE heat_treatment_temp_min IS NOT NULL
        OR heat_treatment_temp_max IS NOT NULL
     ORDER BY name`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Get minerals with SG data for carat estimation dropdown.
 */
export async function getMineralsWithSG(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, sg, sg_min, sg_max FROM minerals
     WHERE sg_min IS NOT NULL AND sg_max IS NOT NULL
     ORDER BY name`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Get minerals with dispersion data for fire reference table.
 */
export async function getMineralsWithDispersion(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, dispersion, ri_min, ri_max, ri
     FROM minerals
     WHERE dispersion IS NOT NULL AND dispersion > 0
     ORDER BY dispersion DESC`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Get minerals with hardness data for hardness reference table.
 */
export async function getMineralsWithHardness(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, hardness, cleavage, fracture, note
     FROM minerals
     WHERE hardness IS NOT NULL AND hardness != ''
     ORDER BY
       CAST(SUBSTR(hardness, 1, INSTR(hardness || '-', '-') - 1) AS REAL) DESC,
       name ASC`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Get minerals suitable for refractometer simulation.
 * Returns gems with RI data, limited to refractometer range (≤1.81).
 */
export async function getMineralsForRefractometer(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, ri_min, ri_max, optical_character
     FROM minerals
     WHERE ri_min IS NOT NULL AND ri_max IS NOT NULL
       AND ri_max <= 1.81
     ORDER BY ri_min ASC`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

/**
 * Get minerals with structured pleochroism data for dichroscope lookup.
 */
export async function getMineralsWithPleochroism(): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, pleochroism, pleochroism_strength,
            pleochroism_color1, pleochroism_color2, pleochroism_color3,
            pleochroism_notes
     FROM minerals
     WHERE pleochroism_strength IS NOT NULL
       AND pleochroism_strength != ''
       AND pleochroism_strength != 'none'
     ORDER BY
       CASE pleochroism_strength
         WHEN 'very_strong' THEN 1
         WHEN 'strong' THEN 2
         WHEN 'moderate' THEN 3
         WHEN 'weak' THEN 4
         ELSE 5
       END,
       name ASC`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });
}

// =============================================================================
// Paginated query functions for large datasets
// =============================================================================

/**
 * Helper to execute a paginated query with count.
 */
async function executePaginatedQuery(
  countSql: string,
  dataSql: string,
  params: PaginationParams,
  queryParams: unknown[] = []
): Promise<PaginatedResult<Mineral>> {
  const database = await getDB();
  const { limit, offset } = toSqlParams(params);

  // Get total count
  const countResult = database.exec(countSql, queryParams);
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  // Get paginated data
  const result = database.exec(dataSql, [...queryParams, limit, offset]);

  if (result.length === 0) {
    return {
      data: [],
      pagination: calculatePagination(total, params.page, params.pageSize),
    };
  }

  const columns = result[0].columns;
  const data = result[0].values.map((row) => {
    const mineral: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      mineral[col] = row[i];
    });
    return mineral as Mineral;
  });

  return {
    data,
    pagination: calculatePagination(total, params.page, params.pageSize),
  };
}

/**
 * Get paginated minerals with SG data.
 */
export async function getMineralsWithSGPaginated(
  params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Mineral>> {
  return executePaginatedQuery(
    `SELECT COUNT(*) FROM minerals WHERE sg_min IS NOT NULL AND sg_max IS NOT NULL`,
    `SELECT id, name, sg, sg_min, sg_max FROM minerals
     WHERE sg_min IS NOT NULL AND sg_max IS NOT NULL
     ORDER BY name
     LIMIT ? OFFSET ?`,
    params
  );
}

/**
 * Get paginated minerals with dispersion data.
 */
export async function getMineralsWithDispersionPaginated(
  params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Mineral>> {
  return executePaginatedQuery(
    `SELECT COUNT(*) FROM minerals WHERE dispersion IS NOT NULL AND dispersion > 0`,
    `SELECT id, name, dispersion, ri_min, ri_max, ri
     FROM minerals
     WHERE dispersion IS NOT NULL AND dispersion > 0
     ORDER BY dispersion DESC
     LIMIT ? OFFSET ?`,
    params
  );
}

/**
 * Get paginated minerals with hardness data.
 */
export async function getMineralsWithHardnessPaginated(
  params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Mineral>> {
  return executePaginatedQuery(
    `SELECT COUNT(*) FROM minerals WHERE hardness IS NOT NULL AND hardness != ''`,
    `SELECT id, name, hardness, cleavage, fracture, note
     FROM minerals
     WHERE hardness IS NOT NULL AND hardness != ''
     ORDER BY
       CAST(SUBSTR(hardness, 1, INSTR(hardness || '-', '-') - 1) AS REAL) DESC,
       name ASC
     LIMIT ? OFFSET ?`,
    params
  );
}

/**
 * Get paginated minerals for refractometer simulation.
 */
export async function getMineralsForRefractometerPaginated(
  params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Mineral>> {
  return executePaginatedQuery(
    `SELECT COUNT(*) FROM minerals
     WHERE ri_min IS NOT NULL AND ri_max IS NOT NULL AND ri_max <= 1.81`,
    `SELECT id, name, ri_min, ri_max, optical_character
     FROM minerals
     WHERE ri_min IS NOT NULL AND ri_max IS NOT NULL
       AND ri_max <= 1.81
     ORDER BY ri_min ASC
     LIMIT ? OFFSET ?`,
    params
  );
}

/**
 * Get paginated minerals with structured pleochroism data.
 */
export async function getMineralsWithPleochroismPaginated(
  params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Mineral>> {
  return executePaginatedQuery(
    `SELECT COUNT(*) FROM minerals
     WHERE pleochroism_strength IS NOT NULL
       AND pleochroism_strength != ''
       AND pleochroism_strength != 'none'`,
    `SELECT id, name, pleochroism, pleochroism_strength,
            pleochroism_color1, pleochroism_color2, pleochroism_color3,
            pleochroism_notes
     FROM minerals
     WHERE pleochroism_strength IS NOT NULL
       AND pleochroism_strength != ''
       AND pleochroism_strength != 'none'
     ORDER BY
       CASE pleochroism_strength
         WHEN 'very_strong' THEN 1
         WHEN 'strong' THEN 2
         WHEN 'moderate' THEN 3
         WHEN 'weak' THEN 4
         ELSE 5
       END,
       name ASC
     LIMIT ? OFFSET ?`,
    params
  );
}

/**
 * Get paginated list of all minerals.
 */
export async function getAllMineralsPaginated(
  params: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Mineral>> {
  return executePaginatedQuery(
    `SELECT COUNT(*) FROM minerals`,
    `SELECT id, name, system, cdl, point_group, chemistry, hardness, description,
            sg, ri, birefringence, optical_character, dispersion, lustre, cleavage,
            fracture, pleochroism, twin_law, phenomenon, note, model_svg,
            ri_min, ri_max, sg_min, sg_max
     FROM minerals
     ORDER BY name ASC
     LIMIT ? OFFSET ?`,
    params
  );
}

// Re-export pagination types and utilities for convenience
export type { PaginationParams, PaginatedResult };
export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from './pagination';

// =============================================================================
// Family + Expression Query Functions (normalized structure)
// =============================================================================

/**
 * Get all mineral families with expression counts.
 * Returns families sorted by name, with count of expressions and primary SVG.
 */
export async function getAllFamilies(): Promise<MineralFamily[]> {
  const database = await getDB();
  const result = database.exec(`
    SELECT
      f.*,
      COUNT(e.id) as expressionCount,
      (SELECT e2.model_svg FROM mineral_expressions e2
       WHERE e2.family_id = f.id AND e2.is_primary = 1 LIMIT 1) as primarySvg
    FROM mineral_families f
    LEFT JOIN mineral_expressions e ON f.id = e.family_id
    GROUP BY f.id
    ORDER BY f.name
  `);

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}

/**
 * Get a single family by ID.
 */
export async function getFamilyById(familyId: string): Promise<MineralFamily | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM mineral_families WHERE id = ?`,
    [familyId.toLowerCase()]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const family: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    family[col] = row[i];
  });
  return family as MineralFamily;
}

/**
 * Get a family with all its expressions.
 */
export async function getFamilyWithExpressions(
  familyId: string
): Promise<MineralFamilyWithExpressions | null> {
  const family = await getFamilyById(familyId);
  if (!family) return null;

  const expressions = await getExpressionsForFamily(familyId);

  return {
    ...family,
    expressions,
  };
}

/**
 * Get all expressions for a family.
 * Returns expressions sorted by is_primary DESC, sort_order ASC.
 */
export async function getExpressionsForFamily(
  familyId: string
): Promise<MineralExpression[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM mineral_expressions
     WHERE family_id = ?
     ORDER BY is_primary DESC, sort_order ASC`,
    [familyId.toLowerCase()]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const expr: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      expr[col] = row[i];
    });
    // Convert is_primary to boolean
    expr.is_primary = Boolean(expr.is_primary);
    expr.sort_order = expr.sort_order || 0;
    return expr as MineralExpression;
  });
}

/**
 * Get a single expression by ID.
 */
export async function getExpressionById(
  expressionId: string
): Promise<MineralExpression | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM mineral_expressions WHERE id = ?`,
    [expressionId.toLowerCase()]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const expr: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    expr[col] = row[i];
  });
  expr.is_primary = Boolean(expr.is_primary);
  expr.sort_order = expr.sort_order || 0;
  return expr as MineralExpression;
}

/**
 * Get families by crystal system.
 */
export async function getFamiliesBySystem(system: string): Promise<MineralFamily[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT f.*, COUNT(e.id) as expressionCount
     FROM mineral_families f
     LEFT JOIN mineral_expressions e ON f.id = e.family_id
     WHERE LOWER(f.crystal_system) = ?
     GROUP BY f.id
     ORDER BY f.name`,
    [system.toLowerCase()]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}

/**
 * Find families matching an RI value within tolerance.
 * Returns unique families (no duplicates like fluorite/fluorite-octahedron).
 */
export async function findFamiliesByRI(
  ri: number,
  tolerance: number = 0.01
): Promise<MineralFamily[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM mineral_families
     WHERE ri_min IS NOT NULL AND ri_max IS NOT NULL
       AND (ri_min - ? <= ? AND ri_max + ? >= ?)
     ORDER BY ABS((ri_min + ri_max) / 2 - ?) ASC
     LIMIT 20`,
    [tolerance, ri, tolerance, ri, ri]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}

/**
 * Find families matching an SG value within tolerance.
 * Returns unique families (no duplicates like fluorite/fluorite-octahedron).
 */
export async function findFamiliesBySG(
  sg: number,
  tolerance: number = 0.05
): Promise<MineralFamily[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM mineral_families
     WHERE sg_min IS NOT NULL AND sg_max IS NOT NULL
       AND (sg_min - ? <= ? AND sg_max + ? >= ?)
     ORDER BY ABS((sg_min + sg_max) / 2 - ?) ASC
     LIMIT 20`,
    [tolerance, sg, tolerance, sg, sg]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}

/**
 * Search families by name or chemistry.
 */
export async function searchFamilies(query: string): Promise<MineralFamily[]> {
  const database = await getDB();
  const searchTerm = `%${query.toLowerCase()}%`;

  const result = database.exec(
    `SELECT f.*, COUNT(e.id) as expressionCount
     FROM mineral_families f
     LEFT JOIN mineral_expressions e ON f.id = e.family_id
     WHERE LOWER(f.name) LIKE ?
        OR LOWER(f.chemistry) LIKE ?
        OR LOWER(f.crystal_system) LIKE ?
     GROUP BY f.id
     ORDER BY
       CASE WHEN LOWER(f.name) LIKE ? THEN 0 ELSE 1 END,
       f.name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm, searchTerm]
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}

/**
 * Get count of families and expressions.
 */
export async function getFamilyStats(): Promise<{ families: number; expressions: number }> {
  const database = await getDB();

  const familyResult = database.exec(`SELECT COUNT(*) FROM mineral_families`);
  const exprResult = database.exec(`SELECT COUNT(*) FROM mineral_expressions`);

  return {
    families: familyResult.length > 0 ? (familyResult[0].values[0][0] as number) : 0,
    expressions: exprResult.length > 0 ? (exprResult[0].values[0][0] as number) : 0,
  };
}

/**
 * Get families with SG data (for calculators - eliminates duplicates).
 */
export async function getFamiliesWithSG(): Promise<MineralFamily[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, sg_min, sg_max FROM mineral_families
     WHERE sg_min IS NOT NULL AND sg_max IS NOT NULL
     ORDER BY name`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}

/**
 * Get families with dispersion data (for calculators - eliminates duplicates).
 */
export async function getFamiliesWithDispersion(): Promise<MineralFamily[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, dispersion, ri_min, ri_max
     FROM mineral_families
     WHERE dispersion IS NOT NULL AND dispersion > 0
     ORDER BY dispersion DESC`
  );

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const family: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      family[col] = row[i];
    });
    return family as MineralFamily;
  });
}
