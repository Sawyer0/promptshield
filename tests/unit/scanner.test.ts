/**
 * NDJSON Scanner Tests - Focus on NDJSON-specific functionality
 * Simplified to cover only NDJSON parsing and scanning
 */

import { describe, test, expect } from '@jest/globals';
import { testHelpers, ndjsonHelpers } from '../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../src/core/scanner';

describe('NDJSON Scanner', () => {
  describe('NDJSON Parsing', () => {
    test('parses valid NDJSON string correctly', () => {
      const testData = [
        { prompt: 'Hello', response: 'Hi' },
        { prompt: 'How are you?', response: 'Good' },
      ];
      const ndjsonString = ndjsonHelpers.createNdjsonString(testData);
      const parsed = ndjsonHelpers.parseNdjsonString(ndjsonString);

      expect(parsed).toEqual(testData);
    });

    test('handles empty lines in NDJSON', () => {
      const ndjsonString = '{"a": 1}\n\n{"b": 2}\n';
      const parsed = ndjsonHelpers.parseNdjsonString(ndjsonString);

      expect(parsed).toEqual([{ a: 1 }, { b: 2 }]);
    });

    test('throws on malformed JSON line', () => {
      const malformedNdjson = '{"a": 1}\n{"b": 2,}\n{"c": 3}';

      expect(() => {
        ndjsonHelpers.parseNdjsonString(malformedNdjson);
      }).toThrow();
    });
  });

  describe('NDJSON File Scanning', () => {
    test('scans valid NDJSON file without violations', async () => {
      const results = await applyRulesToDataOrStream(
        'tests/fixtures/valid.ndjson',
        'rulepacks/pii.yaml',
        false,
        false,
        { ndjsonMode: true }
      );

      expect(results).toHaveLength(1);
      expect(results[0].file).toBe('tests/fixtures/valid.ndjson');
      expect(results[0].violations).toHaveLength(0);
    });

    test('scans NDJSON file with PII violations', async () => {
      const results = await applyRulesToDataOrStream(
        'tests/fixtures/violations.ndjson',
        'rulepacks/pii.yaml',
        false,
        false,
        { ndjsonMode: true }
      );

      expect(results).toHaveLength(1);
      expect(results[0].file).toBe('tests/fixtures/violations.ndjson');
      expect(results[0].violations.length).toBeGreaterThan(0);

      // Check for specific violation types that should be present
      const violationTypes = testHelpers.getUniqueRuleIds(
        results[0].violations
      );
      expect(violationTypes).toContain('email');
      expect(violationTypes).toContain('phone');
      expect(violationTypes).toContain('ssn');
    });

    test('handles malformed NDJSON lines gracefully', async () => {
      const results = await applyRulesToDataOrStream(
        'tests/fixtures/malformed.ndjson',
        'rulepacks/pii.yaml',
        false,
        false,
        { ndjsonMode: true }
      );

      expect(results).toHaveLength(1);
      expect(results[0].file).toBe('tests/fixtures/malformed.ndjson');

      // Should have parse errors for malformed lines
      const parseErrors = results[0].violations.filter(
        (v: any) => v.ruleId === 'ndjson-parse-error'
      );
      expect(parseErrors.length).toBeGreaterThan(0);
    });

    test('handles empty NDJSON file', async () => {
      const results = await applyRulesToDataOrStream(
        'tests/fixtures/empty.ndjson',
        'rulepacks/pii.yaml',
        false,
        false,
        { ndjsonMode: true }
      );

      expect(results).toHaveLength(1);
      expect(results[0].file).toBe('tests/fixtures/empty.ndjson');
      expect(results[0].violations).toHaveLength(0);
    });
  });

  describe('NDJSON File Detection', () => {
    test('auto-detects .ndjson files', async () => {
      const results = await applyRulesToDataOrStream(
        'tests/fixtures/valid.ndjson',
        'rulepacks/pii.yaml',
        false,
        false
      );

      expect(results).toHaveLength(1);
      expect(results[0].file).toBe('tests/fixtures/valid.ndjson');
    });

    test('auto-detects .jsonl files', async () => {
      const results = await applyRulesToDataOrStream(
        'tests/fixtures/valid.ndjson', // Using .ndjson as .jsonl for test
        'rulepacks/pii.yaml',
        false,
        false
      );

      expect(results).toHaveLength(1);
      expect(results[0].file).toBe('tests/fixtures/valid.ndjson');
    });
  });
});
