import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleGetBreedingGuidance } from '../../src/tools/get-breeding-guidance.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-breeding-guidance.db';

describe('get_breeding_guidance tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('sheep gestation is 147 days', () => {
    const result = handleGetBreedingGuidance(db, { species: 'sheep' });
    expect(result).toHaveProperty('guidance');
    const guidance = (result as { guidance: { gestation_days: number }[] }).guidance;
    expect(guidance[0].gestation_days).toBe(147);
  });

  test('cattle gestation is 283 days', () => {
    const result = handleGetBreedingGuidance(db, { species: 'cattle' });
    const guidance = (result as { guidance: { gestation_days: number }[] }).guidance;
    expect(guidance[0].gestation_days).toBe(283);
  });

  test('pig gestation is 114 days', () => {
    const result = handleGetBreedingGuidance(db, { species: 'pigs' });
    const guidance = (result as { guidance: { gestation_days: number }[] }).guidance;
    expect(guidance[0].gestation_days).toBe(114);
  });

  test('parses calendar JSON', () => {
    const result = handleGetBreedingGuidance(db, { species: 'sheep' });
    const guidance = (result as { guidance: { calendar: Record<string, string> }[] }).guidance;
    expect(guidance[0].calendar).toHaveProperty('mating');
    expect(guidance[0].calendar).toHaveProperty('lambing');
    expect(typeof guidance[0].calendar.mating).toBe('string');
  });

  test('filters by topic', () => {
    const result = handleGetBreedingGuidance(db, { species: 'sheep', topic: 'lambing' });
    expect(result).toHaveProperty('guidance');
    const guidance = (result as { guidance: { topic: string }[] }).guidance;
    expect(guidance[0].topic).toBe('lambing');
  });

  test('returns not_found for unknown species', () => {
    const result = handleGetBreedingGuidance(db, { species: 'goat' });
    expect(result).toHaveProperty('error', 'not_found');
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleGetBreedingGuidance(db, { species: 'sheep', jurisdiction: 'NZ' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });
});
