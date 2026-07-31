import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ValidateCommandHandler } from '../../../../src/application/commands/validate/ValidateCommandHandler';
import { ValidateCommand } from '../../../../src/application/commands/validate/ValidateCommand';
import { createValidateConfig } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Rulepack Validation Integration', () => {
  let container: Container;
  let handler: ValidateCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ValidateCommandHandler>(
      'validateCommandHandler'
    );

    tempDir = path.join(__dirname, '../../../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('schema validation', () => {
    test('should validate complete rulepack schema', async () => {
      const completeRulepack = `
name: Complete Test RulePack
description: A complete rulepack for comprehensive testing
version: 2.1.0
author: Test Author
license: MIT
last_updated: 2024-01-15
category: security
priority: high
tags: [pii, security, compliance]
rules:
  - id: email-detection
    description: Detects email addresses in text
    match_regex:
      - '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}'
    match_keywords:
      - '@gmail.com'
      - '@yahoo.com'
    severity: medium
    category: pii
    enabled: true
    confidence: 0.9
    tags: [email, contact]
    examples:
      - match: 'Contact me at user@example.com'
        context: 'Email in contact information'
      - match: 'Send reports to admin@company.org'
        context: 'Business email'
  - id: phone-detection
    description: Detects US phone numbers
    match_regex:
      - '\\(\\d{3}\\)\\s?\\d{3}-\\d{4}'
      - '\\d{3}-\\d{3}-\\d{4}'
    severity: high
    category: pii
    enabled: true
    confidence: 0.95
    metadata:
      region: US
      format: phone
`;

      const testFile = path.join(tempDir, 'complete-rulepack.yaml');
      fs.writeFileSync(testFile, completeRulepack);

      const config = createValidateConfig({
        strict: true,
        checkSchema: true,
      });

      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
      expect(result.value.warnings).toHaveLength(0);
    });

    test('should detect missing required fields', async () => {
      const incompleteRulepack = `
name: Incomplete RulePack
# Missing description, version
rules:
  - id: incomplete-rule
    # Missing description, severity, category
    match_keywords: [test]
`;

      const testFile = path.join(tempDir, 'incomplete-rulepack.yaml');
      fs.writeFileSync(testFile, incompleteRulepack);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.length).toBeGreaterThan(0);

      const errorCodes = result.value.errors.map((e) => e.code);
      expect(errorCodes).toContain('MISSING_DESCRIPTION');
      expect(errorCodes).toContain('MISSING_VERSION');
      expect(errorCodes).toContain('MISSING_RULE_DESCRIPTION');
      expect(errorCodes).toContain('MISSING_SEVERITY');
      expect(errorCodes).toContain('MISSING_CATEGORY');
    });

    test('should validate rule ID uniqueness', async () => {
      const duplicateRulepack = `
name: Duplicate Rules Test
description: Testing duplicate rule IDs
version: 1.0.0
rules:
  - id: duplicate-id
    description: First rule
    match_keywords: [first]
    severity: low
    category: test
  - id: unique-id
    description: Unique rule
    match_keywords: [unique]
    severity: medium
    category: test
  - id: duplicate-id
    description: Second rule with same ID
    match_keywords: [second]
    severity: high
    category: test
`;

      const testFile = path.join(tempDir, 'duplicate-rules.yaml');
      fs.writeFileSync(testFile, duplicateRulepack);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some(
          (e) =>
            e.code === 'DUPLICATE_RULE_ID' && e.message.includes('duplicate-id')
        )
      ).toBe(true);
    });
  });

  describe('regex validation', () => {
    test('should validate regex patterns', async () => {
      const validRegexRulepack = `
name: Valid Regex Test
description: Testing valid regex patterns
version: 1.0.0
rules:
  - id: valid-email
    description: Valid email regex
    match_regex:
      - '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}'
      - '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
    severity: medium
    category: pii
  - id: valid-phone
    description: Valid phone regex
    match_regex:
      - '\\(\\d{3}\\)\\s?\\d{3}-\\d{4}'
      - '\\+1[\\s-]?\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}'
    severity: high
    category: pii
`;

      const testFile = path.join(tempDir, 'valid-regex.yaml');
      fs.writeFileSync(testFile, validRegexRulepack);

      const config = createValidateConfig({ validateRegex: true });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
    });

    test('should detect invalid regex patterns', async () => {
      const invalidRegexRulepack = `
name: Invalid Regex Test
description: Testing invalid regex patterns
version: 1.0.0
rules:
  - id: invalid-regex-1
    description: Rule with unclosed bracket
    match_regex:
      - '[unclosed bracket'
      - '(?<invalid group'
    severity: medium
    category: test
  - id: invalid-regex-2
    description: Rule with invalid quantifier
    match_regex:
      - 'test{invalid}'
      - '*invalid start'
    severity: high
    category: test
`;

      const testFile = path.join(tempDir, 'invalid-regex.yaml');
      fs.writeFileSync(testFile, invalidRegexRulepack);

      const config = createValidateConfig({ validateRegex: true });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.some((e) => e.code === 'INVALID_REGEX')).toBe(
        true
      );
    });

    test('should warn about potentially dangerous regex', async () => {
      const dangerousRegexRulepack = `
name: Dangerous Regex Test
description: Testing potentially dangerous regex patterns
version: 1.0.0
rules:
  - id: catastrophic-backtracking
    description: Rule with potential catastrophic backtracking
    match_regex:
      - '(a+)+$'
      - '(x+x+)+y'
    severity: medium
    category: test
  - id: very-broad-pattern
    description: Very broad pattern that might be slow
    match_regex:
      - '.*.*.*.*.*'
    severity: low
    category: test
`;

      const testFile = path.join(tempDir, 'dangerous-regex.yaml');
      fs.writeFileSync(testFile, dangerousRegexRulepack);

      const config = createValidateConfig({
        validateRegex: true,
        strict: true,
      });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.warnings.length).toBeGreaterThan(0);
      expect(
        result.value.warnings.some((w) => w.code === 'POTENTIALLY_SLOW_REGEX')
      ).toBe(true);
    });
  });

  describe('semantic validation', () => {
    test('should validate severity levels', async () => {
      const invalidSeverityRulepack = `
name: Invalid Severity Test
description: Testing invalid severity levels
version: 1.0.0
rules:
  - id: invalid-severity-1
    description: Rule with invalid severity
    match_keywords: [test]
    severity: extreme
    category: test
  - id: invalid-severity-2
    description: Rule with numeric severity
    match_keywords: [test]
    severity: 5
    category: test
`;

      const testFile = path.join(tempDir, 'invalid-severity.yaml');
      fs.writeFileSync(testFile, invalidSeverityRulepack);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some((e) => e.code === 'INVALID_SEVERITY')
      ).toBe(true);
    });

    test('should validate confidence scores', async () => {
      const invalidConfidenceRulepack = `
name: Invalid Confidence Test
description: Testing invalid confidence scores
version: 1.0.0
rules:
  - id: invalid-confidence-1
    description: Rule with confidence > 1
    match_keywords: [test]
    severity: medium
    category: test
    confidence: 1.5
  - id: invalid-confidence-2
    description: Rule with negative confidence
    match_keywords: [test]
    severity: medium
    category: test
    confidence: -0.2
`;

      const testFile = path.join(tempDir, 'invalid-confidence.yaml');
      fs.writeFileSync(testFile, invalidConfidenceRulepack);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some((e) => e.code === 'INVALID_CONFIDENCE')
      ).toBe(true);
    });

    test('should warn about rules without patterns', async () => {
      const noPatternRulepack = `
name: No Pattern Test
description: Testing rules without match patterns
version: 1.0.0
rules:
  - id: no-pattern-rule
    description: Rule without any match patterns
    severity: medium
    category: test
    enabled: true
`;

      const testFile = path.join(tempDir, 'no-pattern.yaml');
      fs.writeFileSync(testFile, noPatternRulepack);

      const config = createValidateConfig({ strict: true });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(
        result.value.warnings.some((w) => w.code === 'NO_MATCH_PATTERNS')
      ).toBe(true);
    });
  });

  describe('compatibility validation', () => {
    test('should validate version compatibility', async () => {
      const futureVersionRulepack = `
name: Future Version Test
description: Testing future version compatibility
version: 999.0.0
schema_version: 2.0
rules:
  - id: future-rule
    description: Rule from the future
    match_keywords: [future]
    severity: medium
    category: test
`;

      const testFile = path.join(tempDir, 'future-version.yaml');
      fs.writeFileSync(testFile, futureVersionRulepack);

      const config = createValidateConfig({ checkCompatibility: true });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(
        result.value.warnings.some((w) => w.code === 'VERSION_COMPATIBILITY')
      ).toBe(true);
    });

    test('should detect deprecated features', async () => {
      const deprecatedRulepack = `
name: Deprecated Features Test
description: Testing deprecated features
version: 1.0.0
rules:
  - id: deprecated-rule
    description: Rule with deprecated fields
    match_patterns: [deprecated]  # Deprecated field
    priority: high               # Deprecated field
    severity: medium
    category: test
`;

      const testFile = path.join(tempDir, 'deprecated.yaml');
      fs.writeFileSync(testFile, deprecatedRulepack);

      const config = createValidateConfig({ checkDeprecated: true });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(
        result.value.warnings.some((w) => w.code === 'DEPRECATED_FIELD')
      ).toBe(true);
    });
  });

  describe('performance validation', () => {
    test('should validate rulepack size and complexity', async () => {
      const largeRulepack = `
name: Large RulePack Test
description: Testing large rulepack validation
version: 1.0.0
rules:
${Array.from(
  { length: 100 },
  (_, i) => `
  - id: rule-${i}
    description: Auto-generated rule ${i}
    match_keywords: [keyword${i}, test${i}]
    match_regex: ['\\btest${i}\\b']
    severity: ${i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'}
    category: generated
    enabled: true`
).join('')}
`;

      const testFile = path.join(tempDir, 'large-rulepack.yaml');
      fs.writeFileSync(testFile, largeRulepack);

      const config = createValidateConfig({
        checkPerformance: true,
        maxRules: 50,
      });
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(
        result.value.warnings.some((w) => w.code === 'LARGE_RULEPACK')
      ).toBe(true);
    });
  });
});







