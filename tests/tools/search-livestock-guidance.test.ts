import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleSearchLivestockGuidance } from '../../src/tools/search-livestock-guidance.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-search-guidance.db';

describe('search_livestock_guidance tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns results for welfare query', () => {
    const result = handleSearchLivestockGuidance(db, { query: 'welfare' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('returns results for movement query', () => {
    const result = handleSearchLivestockGuidance(db, { query: 'standstill' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('respects species filter', () => {
    const result = handleSearchLivestockGuidance(db, { query: 'welfare', species: 'sheep' });
    const results = (result as { results: { species: string }[] }).results;
    for (const r of results) {
      expect(r.species.toLowerCase()).toBe('sheep');
    }
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleSearchLivestockGuidance(db, { query: 'welfare', jurisdiction: 'FR' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });

  test('returns results for disease query', () => {
    const result = handleSearchLivestockGuidance(db, { query: 'disease' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });
});
