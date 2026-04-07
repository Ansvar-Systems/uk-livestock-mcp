import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface HousingArgs {
  species: string;
  age_class?: string;
  system?: string;
  jurisdiction?: string;
}

type HousingRow = {
  id: number; species_id: string; species_name: string;
  age_class: string; system: string;
  space_per_head_m2: number; ventilation: string;
  flooring: string; temperature_range: string;
  lighting: string; source: string; jurisdiction: string;
};

function formatResult(
  housing: HousingRow[],
  jurisdiction: string,
  hint?: string,
) {
  const result: Record<string, unknown> = {
    species: housing[0].species_name,
    species_id: housing[0].species_id,
    jurisdiction,
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
  if (hint) result._hint = hint;
  return result;
}

export function handleGetHousingRequirements(db: Database, args: HousingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const baseSql = `SELECT hr.*, s.name as species_name FROM housing_requirements hr
    JOIN species s ON hr.species_id = s.id
    WHERE (hr.species_id = ? OR LOWER(s.name) = LOWER(?)) AND hr.jurisdiction = ?`;
  const baseParams: unknown[] = [args.species, args.species, jv.jurisdiction];

  let sql = baseSql;
  const params = [...baseParams];

  if (args.age_class) {
    sql += ' AND LOWER(hr.age_class) = LOWER(?)';
    params.push(args.age_class);
  }

  if (args.system) {
    sql += ' AND LOWER(hr.system) = LOWER(?)';
    params.push(args.system);
  }

  sql += ' ORDER BY hr.age_class, hr.system';

  const housing = db.all<HousingRow>(sql, params);

  if (housing.length > 0) {
    return {
      ...formatResult(housing, jv.jurisdiction),
      _citation: buildCitation(
        `UK Housing: ${args.species}`,
        `Housing requirements for ${args.species} (${jv.jurisdiction})`,
        'get_housing_requirements',
        { species: args.species },
      ),
    };
  }

  if (args.age_class || args.system) {
    const fallback = db.all<HousingRow>(baseSql + ' ORDER BY hr.age_class, hr.system', baseParams);
    if (fallback.length > 0) {
      const parts: string[] = [];
      if (args.age_class) {
        const available = [...new Set(fallback.map(h => h.age_class))];
        parts.push(`age_class '${args.age_class}' not found. Available: ${available.join(', ')}`);
      }
      if (args.system) {
        const available = [...new Set(fallback.map(h => h.system).filter(Boolean))];
        parts.push(`system '${args.system}' not found. Available: ${available.join(', ')}`);
      }
      return {
        ...formatResult(fallback, jv.jurisdiction, parts.join('. ') + '. Showing all results.'),
        _citation: buildCitation(
          `UK Housing: ${args.species}`,
          `Housing requirements for ${args.species} (${jv.jurisdiction})`,
          'get_housing_requirements',
          { species: args.species },
        ),
      };
    }
  }

  return {
    error: 'not_found',
    message: `No housing requirement data found for '${args.species}'.`,
  };
}
