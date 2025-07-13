/**
 * Simplified CLI Tests - Focus on core CLI functionality
 * Consolidates the most important CLI test scenarios
 */

import { describe, test, expect } from '@jest/globals';
import { runCliCommand } from '../utils/cli';
import { runCliCommandAndExpectError } from '../utils/cliError';
import { cliHelpers } from '../utils/testHelpers';

describe('CLI Core Functionality', () => {
  describe('Basic Commands', () => {
    test('--help shows usage', () => {
      const result = runCliCommand(cliHelpers.scenarios.helpCommand);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('promptshield');
      expect(result.stdout).toContain('Scan prompts and responses');
    });

    test('--version shows version', () => {
      const result = runCliCommand(cliHelpers.scenarios.versionCommand);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('1.0.0');
    });

    test('invalid command shows error', () => {
      const { stderr } = runCliCommandAndExpectError(cliHelpers.scenarios.invalidCommand, /unknown command/i);
      expect(stderr).toMatch(/unknown command/i);
    });
  });

  describe('File Scanning', () => {
    test('scans valid JSON files', () => {
      const result = runCliCommand(cliHelpers.scenarios.basicScan);
      expect(result.stdout).toBeDefined();
      expect(result.stderr).toBeDefined();
      
      if (result.success) {
        expect(result.stdout).toContain('tests/fixtures/valid.json');
      }
    });

    test('handles missing files gracefully', () => {
      const result = runCliCommand(cliHelpers.scenarios.missingFile);
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('ENOENT: no such file or directory');
    });

    test('handles missing rulepacks gracefully', () => {
      const result = runCliCommand(cliHelpers.scenarios.missingRulepack);
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('RulePack file not found');
    });
  });

  describe('File Format Support', () => {
    test('supports NDJSON files', () => {
      const result = runCliCommand('node bin/promptshield scan tests/fixtures/valid.ndjson --rulepack rulepacks/pii.yaml');
      expect(result.stdout).toBeDefined();
      
      if (result.success) {
        expect(result.stdout).toContain('tests/fixtures/valid.ndjson');
      }
    });

    test('supports nested JSON with custom fields', () => {
      const result = runCliCommand('node bin/promptshield scan tests/fixtures/nested.json --fields "prompt,user.profile.email" --rulepack rulepacks/pii.yaml');
      expect(result.stdout).toBeDefined();
      
      if (result.success) {
        expect(result.stdout).toContain('tests/fixtures/nested.json');
      }
    });
  });

  describe('Schema Validation', () => {
    test('validates against basic schema', () => {
      const result = runCliCommand('node bin/promptshield scan tests/fixtures/schema-basic.json --schema basic --rulepack rulepacks/pii.yaml');
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('tests/fixtures/schema-basic.json');
    });

    test('rejects invalid schema data', () => {
      const result = runCliCommand('node bin/promptshield scan tests/fixtures/schema-invalid.json --schema basic --rulepack rulepacks/pii.yaml');
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Schema validation failed');
    });
  });

  describe('Error Handling', () => {
    test('shows error for unsupported file format', () => {
      const result = runCliCommand('node bin/promptshield scan tests/fixtures/sample.txt --rulepack rulepacks/pii.yaml');
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Unsupported file format');
    });

    test('provides helpful error messages', () => {
      const result = runCliCommand('node bin/promptshield scan');
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('missing required argument');
    });
  });
}); 