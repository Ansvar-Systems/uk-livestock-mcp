import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface HousingArgs {
  species: string;
  age_class?: string;
  system?: string;
  jurisdiction?: string;
}

export function handleGetHousingRequirements(db: Database, args: HousingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT hr.*, s.name as species_name FROM housing_requirements hr
    JOIN species s ON hr.species_id = s.id
    WHERE (hr.species_id = ? OR LOWER(s.name) = LOWER(?)) AND hr.jurisdiction = ?`;
  const params: unknown[] = [args.species, args.species, jv.jurisdiction];

  if (args.age_class) {
    sql += ' AND LOWER(hr.age_class) = LOWER(?)';
    params.push(args.age_class);
  }

  if (args.system) {
    sql += ' AND LOWER(hr.system) = LOWER(?)';
    params.push(args.system);
  }

  sql += ' ORDER BY hr.age_class, hr.system';

  const housing = db.all<{
    id: number; species_id: string; species_name: string;
    age_class: string; system: string;
    space_per_head_m2: number; ventilation: string;
    flooring: string; temperature_range: string;
    lighting: string; source: string; jurisdiction: string;
  }>(sql, params);

  if (housing.length === 0) {
    return {
      error: 'not_found',
      message: `No housing requirement data found for '${args.species}'.`,
    };
  }

  return {
    species: housing[0].species_name,
    species_id: housing[0].species_id,
    jurisdiction: jv.jurisdiction,
    results_count: housing.length,
    requirements: housing.map(h => ({
      age_class: h.age_class,
      system: h.system,
      space_per_head_m2: h.space_per_head_m2,
      ventilation: h.ventilation,
      flooring: h.flooring,
      temperature_range: h.temperature_range,
      lighting: h.lighting,
      source: h.source,
    })),
    _meta: buildMeta(),
  };
}
