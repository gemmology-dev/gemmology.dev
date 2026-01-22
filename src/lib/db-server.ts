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

    // Try to find the database file
    let dbPath: string;
    try {
      // Try npm package first
      const mineralData = await import('@gemmology/mineral-data');
      dbPath = mineralData.dbPath;
    } catch {
      // Fallback to public directory
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
