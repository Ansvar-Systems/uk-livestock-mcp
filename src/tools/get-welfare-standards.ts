import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface WelfareArgs {
  species: string;
  production_system?: string;
  jurisdiction?: string;
}

type WelfareRow = {
  id: number; species_id: string; species_name: string;
  production_system: string; category: string; standard: string;
  legal_minimum: string; best_practice: string;
  regulation_ref: string; source: string; jurisdiction: string;
};

function formatResult(
  standards: WelfareRow[],
  jurisdiction: string,
  hint?: string,
) {
  const result: Record<string, unknown> = {
    species: standards[0].species_name,
    species_id: standards[0].species_id,
    jurisdiction,
    results_count: standards.length,
    standards: standards.map(s => ({
      category: s.category,
      production_system: s.production_system,
      standard: s.standard,
      legal_minimum: s.legal_minimum,
      best_practice: s.best_practice,
      regulation_ref: s.regulation_ref,
      source: s.source,
    })),
    _meta: buildMeta({ source_url: 'https://www.gov.uk/government/collections/animal-welfare-codes-of-practice' }),
  };
  if (hint) result._hint = hint;
  return result;
}

export function handleGetWelfareStandards(db: Database, args: WelfareArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const baseSql = `SELECT ws.*, s.name as species_name FROM welfare_standards ws
    JOIN species s ON ws.species_id = s.id
    WHERE (ws.species_id = ? OR LOWER(s.name) = LOWER(?)) AND ws.jurisdiction = ?`;
  const baseParams: unknown[] = [args.species, args.species, jv.jurisdiction];

  let sql = baseSql;
  const params = [...baseParams];

  if (args.production_system) {
    sql += ' AND LOWER(ws.production_system) = LOWER(?)';
    params.push(args.production_system);
  }

  sql += ' ORDER BY ws.category, ws.id';

  const standards = db.all<WelfareRow>(sql, params);

  if (standards.length > 0) {
    return formatResult(standards, jv.jurisdiction);
  }

  if (args.production_system) {
    const fallback = db.all<WelfareRow>(baseSql + ' ORDER BY ws.category, ws.id', baseParams);
    if (fallback.length > 0) {
      const available = [...new Set(fallback.map(s => s.production_system).filter(Boolean))];
      return formatResult(
        fallback, jv.jurisdiction,
        `production_system '${args.production_system}' not found. Available: ${available.join(', ')}. Showing all results.`,
      );
    }
  }

  return {
    error: 'not_found',
    message: `No welfare standards found for '${args.species}'` +
      (args.production_system ? ` in ${args.production_system} system` : '') + '.',
  };
}
