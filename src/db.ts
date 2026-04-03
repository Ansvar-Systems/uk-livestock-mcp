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
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('mcp_name', 'Livestock MCP');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('jurisdiction', 'GB');
  `);
}

export function ftsSearch(
  db: Database,
  query: string,
  limit: number = 20
): { title: string; body: string; species: string; category: string; jurisdiction: string; rank: number }[] {
  return db.all(
    `SELECT title, body, species, category, jurisdiction, rank
     FROM search_index
     WHERE search_index MATCH ?
     ORDER BY rank
     LIMIT ?`,
    [query, limit]
  );
}
