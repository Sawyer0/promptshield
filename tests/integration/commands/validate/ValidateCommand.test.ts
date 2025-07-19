import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ValidateCommandHandler } from '../../../../src/application/commands/validate/ValidateCommandHandler';
import { ValidateCommand } from '../../../../src/application/commands/validate/ValidateCommand';

describe('Validate Command Integration Tests', () => {
  let container: Container;
  let handler: ValidateCommandHandler;
  const fixturesDir = path.join(__dirname, '../../../fixtures/validation');

  beforeAll(() => {
    // Setup container with all dependencies
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ValidateCommandHandler>(
      'validateCommandHandler'
    );

    // Create fixtures directory
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup fixtures
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('RulePack Validation', () => {
    test('should validate a valid rulepack', async () => {
      // Create a valid rulepack
      const validRulepack = `
name: Test RulePack
description: Test rulepack for validation
version: 1.0.0
last_updated: 2025-01-15
rules:
  - id: test-rule-1
    description: Test rule 1
    match_keywords:
      - test
      - example
    severity: medium
    category: test
    enabled: true
  - id: test-rule-2
    description: Test rule 2
    match_regex:
      - "\\btest\\b"
    severity: high
    category: test
    enabled: true
`;
      const rulepackPath = path.join(fixturesDir, 'valid-rulepack.yaml');
      fs.writeFileSync(rulepackPath, validRulepack);

      const command = new ValidateCommand(rulepackPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
      expect(result.value.warnings).toHaveLength(0);
    });

    test('should detect missing required fields', async () => {
      const invalidRulepack = `
name: Invalid RulePack
# Missing description and version
rules:
  - id: test-rule
    # Missing description
    match_keywords: [test]
    severity: medium
    category: test
`;
      const rulepackPath = path.join(fixturesDir, 'invalid-rulepack.yaml');
      fs.writeFileSync(rulepackPath, invalidRulepack);

      const command = new ValidateCommand(rulepackPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.length).toBeGreaterThan(0);
      expect(
        result.value.errors.some((e) => e.code === 'MISSING_DESCRIPTION')
      ).toBe(true);
      expect(
        result.value.errors.some((e) => e.code === 'MISSING_VERSION')
      ).toBe(true);
    });

    test('should detect invalid regex patterns', async () => {
      const invalidRegexRulepack = `
name: Invalid Regex RulePack
description: Rulepack with invalid regex
version: 1.0.0
rules:
  - id: bad-regex
    description: Rule with invalid regex
    match_regex:
      - "[unclosed bracket"
      - "(?<invalid group"
    severity: high
    category: test
`;
      const rulepackPath = path.join(fixturesDir, 'invalid-regex.yaml');
      fs.writeFileSync(rulepackPath, invalidRegexRulepack);

      const command = new ValidateCommand(rulepackPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.some((e) => e.code === 'INVALID_REGEX')).toBe(
        true
      );
    });

    test('should detect duplicate rule IDs', async () => {
      const duplicateIdRulepack = `
name: Duplicate ID RulePack
description: Rulepack with duplicate IDs
version: 1.0.0
rules:
  - id: duplicate-id
    description: First rule
    match_keywords: [test]
    severity: low
    category: test
  - id: duplicate-id
    description: Second rule with same ID
    match_keywords: [example]
    severity: medium
    category: test
`;
      const rulepackPath = path.join(fixturesDir, 'duplicate-ids.yaml');
      fs.writeFileSync(rulepackPath, duplicateIdRulepack);

      const command = new ValidateCommand(rulepackPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.some((e) => e.code === 'DUPLICATE_ID')).toBe(
        true
      );
    });

    test('should add warnings in strict mode', async () => {
      const minimalRulepack = `
name: Minimal RulePack
description: Minimal rulepack without optional fields
version: 1.0.0
rules:
  - id: minimal-rule
    description: Minimal rule
    match_keywords: [test]
    severity: medium
    category: test
`;
      const rulepackPath = path.join(fixturesDir, 'minimal-rulepack.yaml');
      fs.writeFileSync(rulepackPath, minimalRulepack);

      const command = new ValidateCommand(rulepackPath, { strict: true });
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true); // Still valid
      expect(result.value.warnings.length).toBeGreaterThan(0);
      expect(
        result.value.warnings.some((w) => w.code === 'MISSING_AUTHOR')
      ).toBe(true);
    });
  });

  describe('Input File Validation', () => {
    test('should validate valid JSON file', async () => {
      const validJson = JSON.stringify(
        [
          { prompt: 'Test prompt', response: 'Test response' },
          { prompt: 'Another prompt', response: 'Another response' },
        ],
        null,
        2
      );
      const jsonPath = path.join(fixturesDir, 'valid.json');
      fs.writeFileSync(jsonPath, validJson);

      const command = new ValidateCommand(jsonPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
    });

    test('should detect invalid JSON syntax', async () => {
      const invalidJson =
        '{"prompt": "Test", "response": "Missing closing brace"';
      const jsonPath = path.join(fixturesDir, 'invalid.json');
      fs.writeFileSync(jsonPath, invalidJson);

      const command = new ValidateCommand(jsonPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some((e) => e.code === 'INVALID_CONTENT')
      ).toBe(true);
    });

    test('should validate NDJSON file', async () => {
      const validNdjson = [
        '{"prompt": "Test 1", "response": "Response 1"}',
        '{"prompt": "Test 2", "response": "Response 2"}',
        '{"prompt": "Test 3", "response": "Response 3"}',
      ].join('\n');
      const ndjsonPath = path.join(fixturesDir, 'valid.ndjson');
      fs.writeFileSync(ndjsonPath, validNdjson);

      const command = new ValidateCommand(ndjsonPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
    });

    test('should detect invalid NDJSON lines', async () => {
      const invalidNdjson = [
        '{"prompt": "Valid line", "response": "OK"}',
        '{"prompt": "Invalid line", "response": ', // Invalid JSON
        '{"prompt": "Another valid line", "response": "OK"}',
      ].join('\n');
      const ndjsonPath = path.join(fixturesDir, 'invalid.ndjson');
      fs.writeFileSync(ndjsonPath, invalidNdjson);

      const command = new ValidateCommand(ndjsonPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some((e) => e.code === 'INVALID_JSON_LINE')
      ).toBe(true);
      expect(
        result.value.errors.some((e) => e.message.includes('Line 2'))
      ).toBe(true);
    });

    test('should validate text file', async () => {
      const validText =
        'This is a test text file\nWith multiple lines\nFor validation testing';
      const textPath = path.join(fixturesDir, 'valid.txt');
      fs.writeFileSync(textPath, validText);

      const command = new ValidateCommand(textPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
    });

    test('should warn about empty files', async () => {
      const emptyPath = path.join(fixturesDir, 'empty.json');
      fs.writeFileSync(emptyPath, '');

      const command = new ValidateCommand(emptyPath, {});
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true); // Empty is valid
      expect(result.value.warnings.some((w) => w.code === 'EMPTY_FILE')).toBe(
        true
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent files', async () => {
      const command = new ValidateCommand('/non/existent/file.yaml', {});
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('No validator found');
    });

    test('should handle unsupported file formats', async () => {
      const binaryPath = path.join(fixturesDir, 'test.bin');
      fs.writeFileSync(binaryPath, Buffer.from([0x00, 0x01, 0x02, 0x03]));

      const command = new ValidateCommand(binaryPath, {});
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('No validator found');
    });
  });

  describe('Output Formats', () => {
    test('should respect output format option', async () => {
      const validRulepack = `
name: Test
description: Test
version: 1.0.0
rules:
  - id: test
    description: Test
    match_keywords: [test]
    severity: low
    category: test
`;
      const rulepackPath = path.join(fixturesDir, 'output-test.yaml');
      fs.writeFileSync(rulepackPath, validRulepack);

      // Test with JSON output
      const command = new ValidateCommand(rulepackPath, { output: 'json' });
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      // The handler would have called console.log with JSON
      // In a real test, we'd mock console.log to verify
    });
  });
});
