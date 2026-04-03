import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleGetWelfareStandards } from '../../src/tools/get-welfare-standards.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-welfare-standards.db';

describe('get_welfare_standards tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns standards for sheep', () => {
    const result = handleGetWelfareStandards(db, { species: 'sheep' });
    expect(result).toHaveProperty('standards');
    const standards = (result as { standards: unknown[] }).standards;
    expect(standards.length).toBeGreaterThanOrEqual(2);
  });

  test('includes both legal_minimum and best_practice', () => {
    const result = handleGetWelfareStandards(db, { species: 'sheep' });
    const standards = (result as { standards: { legal_minimum: string; best_practice: string }[] }).standards;
    for (const s of standards) {
      expect(s.legal_minimum).toBeTruthy();
      expect(s.best_practice).toBeTruthy();
    }
  });

  test('legal_minimum differs from best_practice', () => {
    const result = handleGetWelfareStandards(db, { species: 'sheep' });
    const standards = (result as { standards: { legal_minimum: string; best_practice: string }[] }).standards;
    const shelter = standards.find(s => s.legal_minimum?.includes('severe weather'));
    expect(shelter).toBeDefined();
    expect(shelter!.best_practice).toContain('year-round');
  });

  test('filters by species', () => {
    const result = handleGetWelfareStandards(db, { species: 'cattle' });
    expect(result).toHaveProperty('species', 'Cattle');
  });

  test('filters by production_system', () => {
    const result = handleGetWelfareStandards(db, { species: 'sheep', production_system: 'outdoor' });
    const standards = (result as { standards: { production_system: string }[] }).standards;
    expect(standards.length).toBeGreaterThanOrEqual(1);
    expect(standards[0].production_system).toBe('outdoor');
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleGetWelfareStandards(db, { species: 'sheep', jurisdiction: 'DE' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });

  test('returns not_found for unknown species', () => {
    const result = handleGetWelfareStandards(db, { species: 'ostrich' });
    expect(result).toHaveProperty('error', 'not_found');
  });

  test('includes regulation_ref and source', () => {
    const result = handleGetWelfareStandards(db, { species: 'pigs' });
    const standards = (result as { standards: { regulation_ref: string; source: string }[] }).standards;
    expect(standards[0].regulation_ref).toContain('Regulations');
    expect(standards[0].source).toContain('DEFRA');
  });
});
