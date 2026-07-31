import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { YamlRuleRepository } from '../../../../../src/domains/rules/adapters/YamlRuleRepository';
import { FileReader } from '../../../../../src/domains/scanning/core/ports/FileReader';
import { ok, err } from '../../../../../src/shared/types/Result';
import * as yaml from 'js-yaml';

// Mock js-yaml
jest.mock('js-yaml');
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('YamlRuleRepository', () => {
  let repository: YamlRuleRepository;
  let mockFileReader: jest.Mocked<FileReader>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFileReader = {
      exists: jest.fn(),
      isDirectory: jest.fn(),
      listFiles: jest.fn(),
      readFile: jest.fn(),
      getFileSize: jest.fn(),
    } as jest.Mocked<FileReader>;

    repository = new YamlRuleRepository(mockFileReader);
  });

  describe('loadRulePack', () => {
    test('should load valid rulepack successfully', async () => {
      const yamlData = {
        version: '1.0.0',
        name: 'Test RulePack',
        description: 'Test description',
        rules: [
          {
            id: 'test-rule',
            description: 'Test rule',
            match_keywords: ['test'],
            severity: 'medium',
            category: 'custom',
            enabled: true,
          },
        ],
      };

      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.readFile.mockResolvedValue(ok('yaml content'));
      mockYaml.load.mockReturnValue(yamlData);

      const result = await repository.loadRulePack('test-rulepack.yaml');

      expect(result.isOk()).toBe(true);
      expect(result.value.name).toBe('Test RulePack');
      expect(result.value.rules).toHaveLength(1);
    });

    test('should handle file not found', async () => {
      mockFileReader.exists.mockResolvedValue(false);

      const result = await repository.loadRulePack('nonexistent.yaml');

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('RulePack file not found');
    });

    test('should handle YAML parsing error', async () => {
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.readFile.mockResolvedValue(ok('invalid yaml'));
      mockYaml.load.mockImplementation(() => {
        throw new Error('YAML parsing error');
      });

      const result = await repository.loadRulePack('invalid.yaml');

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Failed to parse YAML');
    });
  });

  describe('validateRulePack', () => {
    test('should validate correct rulepack structure', async () => {
      const validYamlData = {
        version: '1.0.0',
        name: 'Valid RulePack',
        description: 'Valid description',
        rules: [
          {
            id: 'valid-rule',
            description: 'Valid rule',
            match_keywords: ['test'],
            severity: 'medium',
            category: 'custom',
          },
        ],
      };

      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.readFile.mockResolvedValue(ok('yaml content'));
      mockYaml.load.mockReturnValue(validYamlData);

      const result = await repository.validateRulePack('valid.yaml');

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
    });

    test('should detect missing required fields', async () => {
      const invalidYamlData = {
        version: '1.0.0',
        rules: [
          {
            id: 'rule1',
            match_keywords: ['test'],
          },
        ],
      };

      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.readFile.mockResolvedValue(ok('yaml content'));
      mockYaml.load.mockReturnValue(invalidYamlData);

      const result = await repository.validateRulePack('invalid.yaml');

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.length).toBeGreaterThan(0);
    });

    test('should detect duplicate rule IDs', async () => {
      const yamlData = {
        version: '1.0.0',
        name: 'Test',
        description: 'Test',
        rules: [
          {
            id: 'duplicate-id',
            description: 'First',
            match_keywords: ['test1'],
            severity: 'medium',
            category: 'custom',
          },
          {
            id: 'duplicate-id',
            description: 'Second',
            match_keywords: ['test2'],
            severity: 'high',
            category: 'custom',
          },
        ],
      };

      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.readFile.mockResolvedValue(ok('yaml content'));
      mockYaml.load.mockReturnValue(yamlData);

      const result = await repository.validateRulePack('duplicate-ids.yaml');

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some((e) => e.message.includes('Duplicate rule ID'))
      ).toBe(true);
    });
  });

  describe('listRulePacks', () => {
    test('should list yaml files in directory', async () => {
      const files = [
        '/path/rulepack1.yaml',
        '/path/not-yaml.txt',
        '/path/rulepack2.yml',
      ];

      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(true);
      mockFileReader.listFiles.mockResolvedValue(ok(files));

      const result = await repository.listRulePacks('/path');

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([
        '/path/rulepack1.yaml',
        '/path/rulepack2.yml',
      ]);
    });
  });
});







