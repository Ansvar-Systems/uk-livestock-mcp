import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface StockingArgs {
  species: string;
  age_class?: string;
  housing_type?: string;
  jurisdiction?: string;
}

export function handleGetStockingDensity(db: Database, args: StockingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT sd.*, s.name as species_name FROM stocking_densities sd
    JOIN species s ON sd.species_id = s.id
    WHERE (sd.species_id = ? OR LOWER(s.name) = LOWER(?)) AND sd.jurisdiction = ?`;
  const params: unknown[] = [args.species, args.species, jv.jurisdiction];

  if (args.age_class) {
    sql += ' AND LOWER(sd.age_class) = LOWER(?)';
    params.push(args.age_class);
  }

  if (args.housing_type) {
    sql += ' AND LOWER(sd.housing_type) = LOWER(?)';
    params.push(args.housing_type);
  }

  sql += ' ORDER BY sd.age_class, sd.housing_type';

  const densities = db.all<{
    id: number; species_id: string; species_name: string;
    age_class: string; housing_type: string;
    density_value: number; density_unit: string;
    legal_minimum: number; recommended: number;
    source: string; jurisdiction: string;
  }>(sql, params);

  if (densities.length === 0) {
    return {
      error: 'not_found',
      message: `No stocking density data found for '${args.species}'.`,
    };
  }

  return {
    species: densities[0].species_name,
    species_id: densities[0].species_id,
    jurisdiction: jv.jurisdiction,
    results_count: densities.length,
    densities: densities.map(d => ({
      age_class: d.age_class,
      housing_type: d.housing_type,
      density_value: d.density_value,
      density_unit: d.density_unit,
      legal_minimum: d.legal_minimum,
      recommended: d.recommended,
      source: d.source,
    })),
    _meta: buildMeta(),
  };
}
