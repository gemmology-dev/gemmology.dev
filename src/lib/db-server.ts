/**
 * Server-side database access for Static Site Generation (SSG)
 * Uses sql.js in Node.js mode - no browser APIs required
 */
import initSqlJs, { type Database } from 'sql.js';
import { readFileSync } from 'fs';
import { join } from 'path';

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
  model_svg?: string;
  model_stl?: Uint8Array;
  model_gltf?: string;
  models_generated_at?: string;
}

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export async function getDB(): Promise<Database> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const SQL = await initSqlJs();

    // Use npm package as the primary source (v1.1.0+ has enriched data)
    let dbPath: string;

    try {
      const mineralData = await import('@gemmology/mineral-data');
      dbPath = mineralData.dbPath;
    } catch {
      // Fallback to public directory for browser builds
      dbPath = join(process.cwd(), 'public', 'minerals.db');
    }

    const buffer = readFileSync(dbPath);
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
           fracture, pleochroism, twin_law, phenomenon, note
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

export async function getMineralWithModels(name: string): Promise<Mineral | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, system, cdl, point_group, chemistry, hardness, description,
            sg, ri, birefringence, optical_character, dispersion, lustre, cleavage,
            fracture, pleochroism, twin_law, phenomenon, note,
            model_svg, model_gltf
     FROM minerals WHERE name = ? LIMIT 1`,
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

export async function getMineralsBySystemWithSvg(system: string): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT id, name, system, cdl, point_group, chemistry, hardness, description,
            sg, ri, birefringence, optical_character, dispersion, lustre, cleavage,
            fracture, pleochroism, twin_law, phenomenon, note, model_svg
     FROM minerals WHERE LOWER(system) = ? ORDER BY name ASC`,
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
  return [];
}

// =============================================================================
// Family + Expression Types and Query Functions
// =============================================================================

/**
 * A mineral family with shared gemmological properties.
 */
export interface MineralFamily {
  id: string;
  name: string;
  crystal_system: string;
  point_group?: string;
  chemistry?: string;
  category?: string;
  hardness_min?: number;
  hardness_max?: number;
  sg_min?: number;
  sg_max?: number;
  ri_min?: number;
  ri_max?: number;
  birefringence?: number;
  dispersion?: number;
  optical_character?: string;
  pleochroism?: string;
  lustre?: string;
  cleavage?: string;
  fracture?: string;
  description?: string;
  notes?: string;
  diagnostic_features?: string;
  localities_json?: string;
  colors_json?: string;
  treatments_json?: string;
  inclusions_json?: string;
  forms_json?: string;
  twin_law?: string;
  phenomenon?: string;
  fluorescence?: string;
  expressionCount?: number;
  primarySvg?: string;
}

/**
 * A crystal morphology expression within a mineral family.
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
  svg_path?: string;
  gltf_path?: string;
  model_svg?: string;
  model_gltf?: string;
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

/**
 * Get all mineral families with expression counts.
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
    `SELECT f.*, COUNT(e.id) as expressionCount
     FROM mineral_families f
     LEFT JOIN mineral_expressions e ON f.id = e.family_id
     WHERE f.id = ?
     GROUP BY f.id`,
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
 * Get all expressions for a family.
 */
export async function getExpressionsForFamily(familyId: string): Promise<MineralExpression[]> {
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
    expr.is_primary = Boolean(expr.is_primary);
    expr.sort_order = expr.sort_order || 0;
    return expr as MineralExpression;
  });
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
 * Get an expression by slug within a family.
 */
export async function getExpressionBySlug(
  familyId: string,
  slug: string
): Promise<MineralExpression | null> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM mineral_expressions
     WHERE family_id = ? AND slug = ?
     LIMIT 1`,
    [familyId.toLowerCase(), slug.toLowerCase()]
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
