import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export interface Mineral {
  id: number;
  name: string;
  system: string;
  cdl: string;
  chemistry?: string;
  hardness?: string;
  sg?: string;
  ri?: string;
  birefringence?: string;
  pleochroism?: string;
  dispersion?: string;
  lustre?: string;
  cleavage?: string;
  fracture?: string;
  category?: string;
}

export async function getDB(): Promise<Database> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql.js/${file}`,
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
    SELECT id, name, system, cdl, chemistry, hardness, sg, ri,
           birefringence, pleochroism, dispersion, lustre, cleavage, fracture, category
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
        OR LOWER(category) LIKE ?
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

export async function getMineralsByCategory(category: string): Promise<Mineral[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM minerals WHERE LOWER(category) = ? ORDER BY name ASC`,
    [category.toLowerCase()]
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

export async function getCrystalSystems(): Promise<string[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT DISTINCT system FROM minerals WHERE system IS NOT NULL ORDER BY system`
  );

  if (result.length === 0) return [];
  return result[0].values.map((row) => row[0] as string);
}

export async function getCategories(): Promise<string[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT DISTINCT category FROM minerals WHERE category IS NOT NULL ORDER BY category`
  );

  if (result.length === 0) return [];
  return result[0].values.map((row) => row[0] as string);
}
