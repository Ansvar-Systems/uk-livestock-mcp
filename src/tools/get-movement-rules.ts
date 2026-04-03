import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface MovementArgs {
  species: string;
  rule_type?: string;
  jurisdiction?: string;
}

export function handleGetMovementRules(db: Database, args: MovementArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT mr.*, s.name as species_name FROM movement_rules mr
    JOIN species s ON mr.species_id = s.id
    WHERE (mr.species_id = ? OR LOWER(s.name) = LOWER(?)) AND mr.jurisdiction = ?`;
  const params: unknown[] = [args.species, args.species, jv.jurisdiction];

  if (args.rule_type) {
    sql += ' AND LOWER(mr.rule_type) = LOWER(?)';
    params.push(args.rule_type);
  }

  sql += ' ORDER BY mr.rule_type, mr.id';

  const rules = db.all<{
    id: number; species_id: string; species_name: string;
    rule_type: string; rule: string;
    standstill_days: number; exceptions: string;
    authority: string; regulation_ref: string; jurisdiction: string;
  }>(sql, params);

  if (rules.length === 0) {
    return {
      error: 'not_found',
      message: `No movement rules found for '${args.species}'.`,
    };
  }

  return {
    species: rules[0].species_name,
    species_id: rules[0].species_id,
    jurisdiction: jv.jurisdiction,
    results_count: rules.length,
    rules: rules.map(r => ({
      rule_type: r.rule_type,
      rule: r.rule,
      standstill_days: r.standstill_days,
      exceptions: r.exceptions,
      authority: r.authority,
      regulation_ref: r.regulation_ref,
    })),
    _meta: buildMeta({ source_url: 'https://www.gov.uk/guidance/cattle-movement-rules' }),
  };
}
