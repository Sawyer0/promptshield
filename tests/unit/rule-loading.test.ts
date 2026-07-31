import { loadAndValidateRulePack } from '../../src/domains/rules/core/services/RuleEngineImpl';
import { RuleSchema, RulePackSchema } from '../../src/rulepacks/schema';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const mockReadFile = fs.readFile as jest.Mock;

const validRulePack = `
version: "1.0.0"
last_updated: "2025-01-15"
name: Test RulePack
description: Test RulePack for unit testing
rules:
  - id: test-rule
    description: Test rule
    match_keywords: ["test"]
    severity: high
    enabled: true
`;

const keywordRulePack = `
version: "1.0.0"
last_updated: "2025-01-15"
name: Keyword Test RulePack
description: Test RulePack with keyword and regex rules
rules:
  - id: keyword-rule
    description: Test keyword matching
    match_keywords: ["test", "example", "sample"]
    severity: medium
    enabled: true
  - id: regex-rule
    description: Test regex matching
    match_regex: ["\\\\b\\\\w+@\\\\w+\\\\.\\\\w+\\\\b", "\\\\b\\\\d{3}-\\\\d{3}-\\\\d{4}\\\\b"]
    severity: high
    enabled: true
  - id: disabled-rule
    description: This rule should be skipped
    match_keywords: ["should", "not", "match"]
    enabled: false
`;

const invalidRulePack = `
version: "1.0.0"
last_updated: "2025-01-15"
name: Invalid RulePack
description: Invalid RulePack for testing
rules:
  - id: test-rule
    description: Test rule
    severity: high
    enabled: true
`;

const malformedYaml = `
- id: test-rule
  match: test
  severity: high
  description: Test rule
  action: flag
  enabled: true
  - id: another-rule
`;

describe('Rule Loading and Validation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('loads and validates a valid RulePack', async () => {
    mockReadFile.mockResolvedValue(validRulePack);
    const rules = await loadAndValidateRulePack('valid.yaml');
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('test-rule');
  });

  test('loads and validates a keyword/regex RulePack', async () => {
    mockReadFile.mockResolvedValue(keywordRulePack);
    const rules = await loadAndValidateRulePack('keyword.yaml');

    // Test behavior: rules are loaded and can be applied
    expect(rules).toHaveLength(3);

    // Test behavior: keyword rules work
    const keywordRule = rules.find((r) => r.id === 'keyword-rule');
    expect(keywordRule).toBeDefined();
    expect(keywordRule?.enabled).toBe(true);

    // Test behavior: regex rules work
    const regexRule = rules.find((r) => r.id === 'regex-rule');
    expect(regexRule).toBeDefined();
    expect(regexRule?.enabled).toBe(true);

    // Test behavior: disabled rules are properly disabled
    const disabledRule = rules.find((r) => r.id === 'disabled-rule');
    expect(disabledRule?.enabled).toBe(false);
  });

  test('throws error for invalid RulePack', async () => {
    mockReadFile.mockResolvedValue(invalidRulePack);
    await expect(loadAndValidateRulePack('invalid.yaml')).rejects.toThrow(
      'Rule must have at least one matching method: match_regex or match_keywords'
    );
  });

  test('throws error for malformed YAML', async () => {
    mockReadFile.mockResolvedValue(malformedYaml);
    await expect(loadAndValidateRulePack('malformed.yaml')).rejects.toThrow(
      'bad indentation of a sequence entry'
    );
  });

  test('RulePackSchema validates correct structure directly', () => {
    const obj = yaml.load(validRulePack);
    expect(() => RulePackSchema.parse(obj)).not.toThrow();
  });

  test('RulePackSchema throws on missing required fields', () => {
    const obj = yaml.load(invalidRulePack);
    expect(() => RulePackSchema.parse(obj)).toThrow();
  });

  test('RuleSchema throws on missing required fields', () => {
    expect(() => RuleSchema.parse({ id: 'x' })).toThrow();
  });
});







