/**
 * Build-time mineral / expression counts.
 *
 * Single source of truth for the number of mineral families and expressions
 * surfaced in homepage / gallery / 404 copy. Reads directly from the SQLite
 * database used for SSG via db-server.ts.
 */
import { getDB } from './db-server';

export interface SiteStats {
  /** Number of mineral families (e.g. Diamond, Ruby, Emerald). */
  familyCount: number;
  /** Number of distinct crystal expressions across all families. */
  expressionCount: number;
}

let cached: SiteStats | null = null;

export async function getSiteStats(): Promise<SiteStats> {
  if (cached) return cached;

  const db = await getDB();

  const familyResult = db.exec('SELECT COUNT(*) FROM mineral_families');
  const familyCount =
    familyResult.length > 0 && familyResult[0].values.length > 0
      ? Number(familyResult[0].values[0][0])
      : 0;

  const exprResult = db.exec('SELECT COUNT(*) FROM mineral_expressions');
  const expressionCount =
    exprResult.length > 0 && exprResult[0].values.length > 0
      ? Number(exprResult[0].values[0][0])
      : 0;

  cached = { familyCount, expressionCount };
  return cached;
}
