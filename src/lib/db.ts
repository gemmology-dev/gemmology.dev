import type { Database, SqlJsStatic } from 'sql.js';

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
