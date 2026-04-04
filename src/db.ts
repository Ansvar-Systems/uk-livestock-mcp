import BetterSqlite3 from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Database {
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
  run(sql: string, params?: unknown[]): void;
  close(): void;
  readonly instance: BetterSqlite3.Database;
}

export function createDatabase(dbPath?: string): Database {
  const resolvedPath =
    dbPath ??
    join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'database.db');
  const db = new BetterSqlite3(resolvedPath);

  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  return {
    get<T>(sql: string, params: unknown[] = []): T | undefined {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, params: unknown[] = []): T[] {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, params: unknown[] = []): void {
      db.prepare(sql).run(...params);
    },
    close(): void {
      db.close();
    },
    get instance() {
      return db;
    },
  };
}

function initSchema(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      common_breeds TEXT
    );

    CREATE TABLE IF NOT EXISTS welfare_standards (
      id INTEGER PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      production_system TEXT,
      category TEXT,
      standard TEXT NOT NULL,
      legal_minimum TEXT,
      best_practice TEXT,
      regulation_ref TEXT,
      source TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE TABLE IF NOT EXISTS stocking_densities (
      id INTEGER PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      age_class TEXT,
      housing_type TEXT,
      density_value REAL,
      density_unit TEXT,
      legal_minimum REAL,
      recommended REAL,
      source TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE TABLE IF NOT EXISTS feed_requirements (
      id INTEGER PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      age_class TEXT,
      production_stage TEXT,
      energy_mj_per_day REAL,
      protein_g_per_day REAL,
      dry_matter_kg REAL,
      minerals TEXT,
      example_ration TEXT,
      notes TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE TABLE IF NOT EXISTS animal_health (
      id TEXT PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      condition TEXT NOT NULL,
      symptoms TEXT,
      causes TEXT,
      treatment TEXT,
      prevention TEXT,
      notifiable INTEGER DEFAULT 0,
      source TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE TABLE IF NOT EXISTS movement_rules (
      id INTEGER PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      rule_type TEXT,
      rule TEXT NOT NULL,
      standstill_days INTEGER,
      exceptions TEXT,
      authority TEXT,
      regulation_ref TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE TABLE IF NOT EXISTS housing_requirements (
      id INTEGER PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      age_class TEXT,
      system TEXT,
      space_per_head_m2 REAL,
      ventilation TEXT,
      flooring TEXT,
      temperature_range TEXT,
      lighting TEXT,
      source TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE TABLE IF NOT EXISTS breeding_guidance (
      id INTEGER PRIMARY KEY,
      species_id TEXT REFERENCES species(id),
      topic TEXT,
      guidance TEXT NOT NULL,
      calendar TEXT,
      gestation_days INTEGER,
      source TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'GB'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      title, body, species, category, jurisdiction
    );

    CREATE TABLE IF NOT EXISTS db_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('schema_version', '1.0');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('mcp_name', 'UK Livestock MCP');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('jurisdiction', 'GB');
  `);
}

const FTS_COLUMNS = ['title', 'body', 'species', 'category', 'jurisdiction'];

export function ftsSearch(
  db: Database,
  query: string,
  limit: number = 20
): { title: string; body: string; species: string; category: string; jurisdiction: string; rank: number }[] {
  const { results } = tieredFtsSearch(db, 'search_index', FTS_COLUMNS, query, limit);
  return results as { title: string; body: string; species: string; category: string; jurisdiction: string; rank: number }[];
}

export function tieredFtsSearch(
  db: Database,
  table: string,
  columns: string[],
  query: string,
  limit: number = 20
): { tier: string; results: Record<string, unknown>[] } {
  const sanitized = sanitizeFtsInput(query);
  if (!sanitized.trim()) return { tier: 'empty', results: [] };

  const columnList = columns.join(', ');
  const select = `SELECT ${columnList}, rank FROM ${table}`;
  const order = `ORDER BY rank LIMIT ?`;

  const phrase = `"${sanitized}"`;
  let results = tryFts(db, select, table, order, phrase, limit);
  if (results.length > 0) return { tier: 'phrase', results };

  const words = sanitized.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    const andQuery = words.join(' AND ');
    results = tryFts(db, select, table, order, andQuery, limit);
    if (results.length > 0) return { tier: 'and', results };
  }

  const prefixQuery = words.map(w => `${w}*`).join(' AND ');
  results = tryFts(db, select, table, order, prefixQuery, limit);
  if (results.length > 0) return { tier: 'prefix', results };

  const stemmed = words.map(w => stemWord(w) + '*');
  const stemmedQuery = stemmed.join(' AND ');
  if (stemmedQuery !== prefixQuery) {
    results = tryFts(db, select, table, order, stemmedQuery, limit);
    if (results.length > 0) return { tier: 'stemmed', results };
  }

  if (words.length > 1) {
    const orQuery = words.join(' OR ');
    results = tryFts(db, select, table, order, orQuery, limit);
    if (results.length > 0) return { tier: 'or', results };
  }

  // LIKE fallback — search welfare_standards then animal_health with real column names
  try {
    // welfare_standards: standard, best_practice, species_id, category
    const welfareCols = ['standard', 'best_practice', 'species_id', 'category'];
    const welfareLike = words.map(() =>
      `(${welfareCols.map(c => `${c} LIKE ?`).join(' OR ')})`
    ).join(' AND ');
    const welfareParams = words.flatMap(w =>
      welfareCols.map(() => `%${w}%`)
    );
    const likeResults = db.all<Record<string, unknown>>(
      `SELECT standard as title, COALESCE(best_practice, '') as body, species_id as species, category, jurisdiction FROM welfare_standards WHERE ${welfareLike} LIMIT ?`,
      [...welfareParams, limit]
    );
    if (likeResults.length > 0) return { tier: 'like', results: likeResults };

    // animal_health: condition, symptoms, treatment
    const healthCols = ['condition', 'symptoms', 'treatment'];
    const healthLike = words.map(() =>
      `(${healthCols.map(c => `${c} LIKE ?`).join(' OR ')})`
    ).join(' AND ');
    const healthParams = words.flatMap(w =>
      healthCols.map(() => `%${w}%`)
    );
    const healthResults = db.all<Record<string, unknown>>(
      `SELECT condition as title, COALESCE(symptoms, '') || ' ' || COALESCE(treatment, '') as body, species_id as species, 'health' as category, jurisdiction FROM animal_health WHERE ${healthLike} LIMIT ?`,
      [...healthParams, limit]
    );
    if (healthResults.length > 0) return { tier: 'like', results: healthResults };
  } catch {
    // LIKE fallback failed
  }

  return { tier: 'none', results: [] };
}

function tryFts(
  db: Database, select: string, table: string,
  order: string, matchExpr: string, limit: number
): Record<string, unknown>[] {
  try {
    return db.all(`${select} WHERE ${table} MATCH ? ${order}`, [matchExpr, limit]);
  } catch {
    return [];
  }
}

function sanitizeFtsInput(query: string): string {
  return query
    .replace(/["""''„‚«»]/g, '"')
    .replace(/[^a-zA-Z0-9\s*"_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  return word
    .replace(/(ies)$/i, 'y')
    .replace(/(ying|tion|ment|ness|able|ible|ous|ive|ing|ers|ed|es|er|ly|s)$/i, '');
}
