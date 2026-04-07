import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface MovementArgs {
  species: string;
  rule_type?: string;
  jurisdiction?: string;
}

type MovementRow = {
  id: number; species_id: string; species_name: string;
  rule_type: string; rule: string;
  standstill_days: number; exceptions: string;
  authority: string; regulation_ref: string; jurisdiction: string;
};

function formatResult(
  rules: MovementRow[],
  jurisdiction: string,
  hint?: string,
) {
  const result: Record<string, unknown> = {
    species: rules[0].species_name,
    species_id: rules[0].species_id,
    jurisdiction,
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
  if (hint) result._hint = hint;
  return result;
}

export function handleGetMovementRules(db: Database, args: MovementArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const baseSql = `SELECT mr.*, s.name as species_name FROM movement_rules mr
    JOIN species s ON mr.species_id = s.id
    WHERE (mr.species_id = ? OR LOWER(s.name) = LOWER(?)) AND mr.jurisdiction = ?`;
  const baseParams: unknown[] = [args.species, args.species, jv.jurisdiction];

  let sql = baseSql;
  const params = [...baseParams];

  if (args.rule_type) {
    sql += ' AND LOWER(mr.rule_type) = LOWER(?)';
    params.push(args.rule_type);
  }

  sql += ' ORDER BY mr.rule_type, mr.id';

  const rules = db.all<MovementRow>(sql, params);

  if (rules.length > 0) {
    return {
      ...formatResult(rules, jv.jurisdiction),
      _citation: buildCitation(
        `UK Movement Rules: ${args.species}`,
        `Livestock movement rules for ${args.species} (${jv.jurisdiction})`,
        'get_movement_rules',
        { species: args.species },
        'https://www.gov.uk/guidance/cattle-movement-rules',
      ),
    };
  }

  if (args.rule_type) {
    const fallback = db.all<MovementRow>(baseSql + ' ORDER BY mr.rule_type, mr.id', baseParams);
    if (fallback.length > 0) {
      const available = [...new Set(fallback.map(r => r.rule_type))];
      return {
        ...formatResult(
          fallback, jv.jurisdiction,
          `rule_type '${args.rule_type}' not found. Available: ${available.join(', ')}. Showing all results.`,
        ),
        _citation: buildCitation(
          `UK Movement Rules: ${args.species}`,
          `Livestock movement rules for ${args.species} (${jv.jurisdiction})`,
          'get_movement_rules',
          { species: args.species },
          'https://www.gov.uk/guidance/cattle-movement-rules',
        ),
      };
    }
  }

  return {
    error: 'not_found',
    message: `No movement rules found for '${args.species}'.`,
  };
}
