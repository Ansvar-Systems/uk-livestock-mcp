import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import { ftsSearch, type Database } from '../db.js';

interface SearchArgs {
  query: string;
  species?: string;
  jurisdiction?: string;
  limit?: number;
}

export function handleSearchLivestockGuidance(db: Database, args: SearchArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const limit = Math.min(args.limit ?? 20, 50);
  let results = ftsSearch(db, args.query, limit);

  if (args.species) {
    results = results.filter(r => r.species.toLowerCase() === args.species!.toLowerCase());
  }

  return {
    query: args.query,
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    results: results.map(r => ({
      title: r.title,
      body: r.body,
      species: r.species,
      category: r.category,
      relevance_rank: r.rank,
    })),
    _meta: buildMeta(),
  };
}
