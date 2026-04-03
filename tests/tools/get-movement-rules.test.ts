import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleGetMovementRules } from '../../src/tools/get-movement-rules.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-movement-rules.db';

describe('get_movement_rules tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('sheep standstill is 6 days', () => {
    const result = handleGetMovementRules(db, { species: 'sheep' });
    expect(result).toHaveProperty('rules');
    const rules = (result as { rules: { standstill_days: number; rule_type: string }[] }).rules;
    const standstill = rules.find(r => r.rule_type === 'standstill');
    expect(standstill).toBeDefined();
    expect(standstill!.standstill_days).toBe(6);
  });

  test('cattle standstill is 13 days', () => {
    const result = handleGetMovementRules(db, { species: 'cattle' });
    expect(result).toHaveProperty('rules');
    const rules = (result as { rules: { standstill_days: number; rule_type: string }[] }).rules;
    const standstill = rules.find(r => r.rule_type === 'standstill');
    expect(standstill).toBeDefined();
    expect(standstill!.standstill_days).toBe(13);
  });

  test('pig standstill is 20 days', () => {
    const result = handleGetMovementRules(db, { species: 'pigs' });
    expect(result).toHaveProperty('rules');
    const rules = (result as { rules: { standstill_days: number; rule_type: string }[] }).rules;
    const standstill = rules.find(r => r.rule_type === 'standstill');
    expect(standstill).toBeDefined();
    expect(standstill!.standstill_days).toBe(20);
  });

  test('filters by species', () => {
    const result = handleGetMovementRules(db, { species: 'sheep' });
    expect(result).toHaveProperty('species', 'Sheep');
  });

  test('includes authority and regulation_ref', () => {
    const result = handleGetMovementRules(db, { species: 'sheep' });
    const rules = (result as { rules: { authority: string; regulation_ref: string }[] }).rules;
    expect(rules[0].authority).toBe('APHA');
    expect(rules[0].regulation_ref).toContain('Order');
  });

  test('includes exceptions', () => {
    const result = handleGetMovementRules(db, { species: 'sheep' });
    const rules = (result as { rules: { exceptions: string }[] }).rules;
    expect(rules[0].exceptions).toContain('market');
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleGetMovementRules(db, { species: 'sheep', jurisdiction: 'FR' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });

  test('returns not_found for unknown species', () => {
    const result = handleGetMovementRules(db, { species: 'alpaca' });
    expect(result).toHaveProperty('error', 'not_found');
  });

  test('looks up by species name case-insensitively', () => {
    const result = handleGetMovementRules(db, { species: 'Sheep' });
    expect(result).toHaveProperty('rules');
  });
});
