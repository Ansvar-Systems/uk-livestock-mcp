import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface FeedArgs {
  species: string;
  age_class?: string;
  production_stage?: string;
  jurisdiction?: string;
}

type FeedRow = {
  id: number; species_id: string; species_name: string;
  age_class: string; production_stage: string;
  energy_mj_per_day: number; protein_g_per_day: number;
  dry_matter_kg: number; minerals: string;
  example_ration: string; notes: string; jurisdiction: string;
};

function formatResult(
  feeds: FeedRow[],
  jurisdiction: string,
  hint?: string,
) {
  const result: Record<string, unknown> = {
    species: feeds[0].species_name,
    species_id: feeds[0].species_id,
    jurisdiction,
    results_count: feeds.length,
    requirements: feeds.map(f => ({
      age_class: f.age_class,
      production_stage: f.production_stage,
      energy_mj_per_day: f.energy_mj_per_day,
      protein_g_per_day: f.protein_g_per_day,
      dry_matter_kg: f.dry_matter_kg,
      minerals: f.minerals ? JSON.parse(f.minerals) : null,
      example_ration: f.example_ration,
      notes: f.notes,
    })),
    _meta: buildMeta(),
  };
  if (hint) result._hint = hint;
  return result;
}

export function handleGetFeedRequirements(db: Database, args: FeedArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const baseSql = `SELECT fr.*, s.name as species_name FROM feed_requirements fr
    JOIN species s ON fr.species_id = s.id
    WHERE (fr.species_id = ? OR LOWER(s.name) = LOWER(?)) AND fr.jurisdiction = ?`;
  const baseParams: unknown[] = [args.species, args.species, jv.jurisdiction];

  let sql = baseSql;
  const params = [...baseParams];

  if (args.age_class) {
    sql += ' AND LOWER(fr.age_class) = LOWER(?)';
    params.push(args.age_class);
  }

  if (args.production_stage) {
    sql += ' AND LOWER(fr.production_stage) = LOWER(?)';
    params.push(args.production_stage);
  }

  sql += ' ORDER BY fr.age_class, fr.production_stage';

  const feeds = db.all<FeedRow>(sql, params);

  if (feeds.length > 0) {
    return {
      ...formatResult(feeds, jv.jurisdiction),
      _citation: buildCitation(
        `UK Feed: ${args.species}`,
        `Feed requirements for ${args.species} (${jv.jurisdiction})`,
        'get_feed_requirements',
        { species: args.species },
      ),
    };
  }

  if (args.age_class || args.production_stage) {
    const fallback = db.all<FeedRow>(baseSql + ' ORDER BY fr.age_class, fr.production_stage', baseParams);
    if (fallback.length > 0) {
      const parts: string[] = [];
      if (args.age_class) {
        const available = [...new Set(fallback.map(f => f.age_class))];
        parts.push(`age_class '${args.age_class}' not found. Available: ${available.join(', ')}`);
      }
      if (args.production_stage) {
        const available = [...new Set(fallback.map(f => f.production_stage).filter(Boolean))];
        parts.push(`production_stage '${args.production_stage}' not found. Available: ${available.join(', ')}`);
      }
      return {
        ...formatResult(fallback, jv.jurisdiction, parts.join('. ') + '. Showing all results.'),
        _citation: buildCitation(
          `UK Feed: ${args.species}`,
          `Feed requirements for ${args.species} (${jv.jurisdiction})`,
          'get_feed_requirements',
          { species: args.species },
        ),
      };
    }
  }

  return {
    error: 'not_found',
    message: `No feed requirement data found for '${args.species}'.`,
  };
}
