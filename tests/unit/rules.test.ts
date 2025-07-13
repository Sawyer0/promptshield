import { loadAndValidateRulePack } from '../../src/core/rules';
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
name: Test RulePack
rules:
  - id: test-rule
    description: Test rule
    pattern: test
    severity: high
    enabled: true
`;

const invalidRulePack = `
name: Invalid RulePack
rules:
  - id: test-rule
    severity: high
    description: Test rule
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

  test('throws error for invalid RulePack', async () => {
    mockReadFile.mockResolvedValue(invalidRulePack);
    await expect(loadAndValidateRulePack('invalid.yaml')).rejects.toThrow('Validation errors in RulePack');
  });

  test('throws error for malformed YAML', async () => {
    mockReadFile.mockResolvedValue(malformedYaml);
    await expect(loadAndValidateRulePack('malformed.yaml')).rejects.toThrow('Error loading or validating RulePack from malformed.yaml: bad indentation of a sequence entry');
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
