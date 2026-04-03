import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface HealthArgs {
  query: string;
  species?: string;
  jurisdiction?: string;
}

export function handleSearchAnimalHealth(db: Database, args: HealthArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT ah.*, s.name as species_name FROM animal_health ah
    JOIN species s ON ah.species_id = s.id
    WHERE ah.jurisdiction = ? AND (
      LOWER(ah.condition) LIKE LOWER(?) OR
      LOWER(ah.symptoms) LIKE LOWER(?) OR
      LOWER(ah.causes) LIKE LOWER(?)
    )`;
  const likeQuery = `%${args.query}%`;
  const params: unknown[] = [jv.jurisdiction, likeQuery, likeQuery, likeQuery];

  if (args.species) {
    sql += ' AND (ah.species_id = ? OR LOWER(s.name) = LOWER(?))';
    params.push(args.species, args.species);
  }

  sql += ' ORDER BY ah.notifiable DESC, ah.condition';

  const conditions = db.all<{
    id: string; species_id: string; species_name: string;
    condition: string; symptoms: string; causes: string;
    treatment: string; prevention: string;
    notifiable: number; source: string; jurisdiction: string;
  }>(sql, params);

  return {
    query: args.query,
    jurisdiction: jv.jurisdiction,
    results_count: conditions.length,
    conditions: conditions.map(c => ({
      id: c.id,
      species: c.species_name,
      condition: c.condition,
      symptoms: c.symptoms,
      causes: c.causes,
      treatment: c.treatment,
      prevention: c.prevention,
      notifiable: c.notifiable === 1,
      source: c.source,
    })),
    _meta: buildMeta({ source_url: 'https://www.gov.uk/government/collections/notifiable-diseases-in-animals' }),
  };
}
