/**
 * Regenerate data/coverage.json from the current database.
 * Usage: npm run coverage:update
 */

import { createDatabase } from '../src/db.js';
import { writeFileSync } from 'fs';

const db = createDatabase();

const species = db.get<{ c: number }>('SELECT count(*) as c FROM species')!.c;
const welfare_standards = db.get<{ c: number }>('SELECT count(*) as c FROM welfare_standards')!.c;
const stocking_densities = db.get<{ c: number }>('SELECT count(*) as c FROM stocking_densities')!.c;
const feed_requirements = db.get<{ c: number }>('SELECT count(*) as c FROM feed_requirements')!.c;
const animal_health = db.get<{ c: number }>('SELECT count(*) as c FROM animal_health')!.c;
const movement_rules = db.get<{ c: number }>('SELECT count(*) as c FROM movement_rules')!.c;
const housing_requirements = db.get<{ c: number }>('SELECT count(*) as c FROM housing_requirements')!.c;
const breeding_guidance = db.get<{ c: number }>('SELECT count(*) as c FROM breeding_guidance')!.c;
const fts = db.get<{ c: number }>('SELECT count(*) as c FROM search_index')!.c;
const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

db.close();

const coverage = {
  mcp_name: 'Livestock MCP',
  jurisdiction: 'GB',
  build_date: lastIngest?.value ?? new Date().toISOString().split('T')[0],
  species,
  welfare_standards,
  stocking_densities,
  feed_requirements,
  animal_health,
  movement_rules,
  housing_requirements,
  breeding_guidance,
  fts_entries: fts,
};

writeFileSync('data/coverage.json', JSON.stringify(coverage, null, 2));
console.log('Updated data/coverage.json:', coverage);
