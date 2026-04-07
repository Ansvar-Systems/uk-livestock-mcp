import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface BreedingArgs {
  species: string;
  topic?: string;
  jurisdiction?: string;
}

type BreedingRow = {
  id: number; species_id: string; species_name: string;
  topic: string; guidance: string; calendar: string;
  gestation_days: number; source: string; jurisdiction: string;
};

function formatResult(
  guidance: BreedingRow[],
  jurisdiction: string,
  hint?: string,
) {
  const result: Record<string, unknown> = {
    species: guidance[0].species_name,
    species_id: guidance[0].species_id,
    jurisdiction,
    results_count: guidance.length,
    guidance: guidance.map(g => ({
      topic: g.topic,
      guidance: g.guidance,
      calendar: g.calendar ? JSON.parse(g.calendar) : null,
      gestation_days: g.gestation_days,
      source: g.source,
    })),
    _meta: buildMeta(),
  };
  if (hint) result._hint = hint;
  return result;
}

export function handleGetBreedingGuidance(db: Database, args: BreedingArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const baseSql = `SELECT bg.*, s.name as species_name FROM breeding_guidance bg
    JOIN species s ON bg.species_id = s.id
    WHERE (bg.species_id = ? OR LOWER(s.name) = LOWER(?)) AND bg.jurisdiction = ?`;
  const baseParams: unknown[] = [args.species, args.species, jv.jurisdiction];

  let sql = baseSql;
  const params = [...baseParams];

  if (args.topic) {
    sql += ' AND LOWER(bg.topic) LIKE LOWER(?)';
    params.push(`%${args.topic}%`);
  }

  sql += ' ORDER BY bg.topic, bg.id';

  const guidance = db.all<BreedingRow>(sql, params);

  if (guidance.length > 0) {
    return {
      ...formatResult(guidance, jv.jurisdiction),
      _citation: buildCitation(
        `UK Breeding: ${args.species}`,
        `Breeding guidance for ${args.species} (${jv.jurisdiction})`,
        'get_breeding_guidance',
        { species: args.species },
      ),
    };
  }

  if (args.topic) {
    const fallback = db.all<BreedingRow>(baseSql + ' ORDER BY bg.topic, bg.id', baseParams);
    if (fallback.length > 0) {
      const available = [...new Set(fallback.map(g => g.topic))];
      return {
        ...formatResult(
          fallback, jv.jurisdiction,
          `topic '${args.topic}' not found. Available: ${available.join(', ')}. Showing all results.`,
        ),
        _citation: buildCitation(
          `UK Breeding: ${args.species}`,
          `Breeding guidance for ${args.species} (${jv.jurisdiction})`,
          'get_breeding_guidance',
          { species: args.species },
        ),
      };
    }
  }

  return {
    error: 'not_found',
    message: `No breeding guidance found for '${args.species}'` +
      (args.topic ? ` on topic '${args.topic}'` : '') + '.',
  };
}
