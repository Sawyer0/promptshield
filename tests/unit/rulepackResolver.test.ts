/**
 * Tests for rulepack resolution functionality
 * Critical for npm publication - ensures rulepacks are found after installation
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  resolveRulepackPath,
  getDefaultRulepackPath,
  listAvailableRulepacks,
} from '../../src/utils/rulepackResolver';

// Mock fs for testing different scenarios
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('RulepackResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset __dirname to test directory
    (global as any).__dirname = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'utils'
    );
  });

  describe('resolveRulepackPath', () => {
    it('should return absolute paths as-is', () => {
      const absolutePath = '/absolute/path/to/rulepack.yaml';
      const result = resolveRulepackPath(absolutePath);
      expect(result).toBe(absolutePath);
    });

    it('should resolve relative paths from current working directory first', () => {
      const relativePath = 'rulepacks/pii.yaml';
      const expectedPath = path.resolve(process.cwd(), relativePath);

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === expectedPath;
      });

      const result = resolveRulepackPath(relativePath);
      expect(result).toBe(expectedPath);
    });

    it('should fallback to package installation directory', () => {
      const relativePath = 'rulepacks/pii.yaml';
      const cwdPath = path.resolve(process.cwd(), relativePath);
      const packagePath = path.resolve(__dirname, '..', '..', relativePath);

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === packagePath;
      });

      const result = resolveRulepackPath(relativePath);
      expect(result).toBe(packagePath);
    });

    it('should fallback to node_modules for global installs', () => {
      const relativePath = 'rulepacks/pii.yaml';
      const nodeModulesPath = path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'promptshield',
        relativePath
      );

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === nodeModulesPath;
      });

      const result = resolveRulepackPath(relativePath);
      expect(result).toBe(nodeModulesPath);
    });

    it('should return original path if nothing found', () => {
      const relativePath = 'rulepacks/nonexistent.yaml';

      mockFs.existsSync.mockReturnValue(false);

      const result = resolveRulepackPath(relativePath);
      expect(result).toBe(relativePath);
    });
  });

  describe('getDefaultRulepackPath', () => {
    it('should return resolved path to default PII rulepack', () => {
      const expectedPath = path.resolve(process.cwd(), 'rulepacks/pii.yaml');

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === expectedPath;
      });

      const result = getDefaultRulepackPath();
      expect(result).toBe(expectedPath);
    });
  });

  describe('listAvailableRulepacks', () => {
    it('should list rulepacks from current working directory', () => {
      const rulepackDir = path.resolve(process.cwd(), 'rulepacks');
      const mockFiles = [
        'pii.yaml',
        'security.yaml',
        'bias.yaml',
        'not-a-rulepack.txt',
      ];

      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath === rulepackDir;
      });

      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = listAvailableRulepacks();
      expect(result).toEqual([
        path.join(rulepackDir, 'pii.yaml'),
        path.join(rulepackDir, 'security.yaml'),
        path.join(rulepackDir, 'bias.yaml'),
      ]);
    });

    it('should fallback to package installation directory', () => {
      const cwdDir = path.resolve(process.cwd(), 'rulepacks');
      const packageDir = path.resolve(__dirname, '..', '..', 'rulepacks');
      const mockFiles = ['pii.yaml', 'security.yaml'];

      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath === packageDir;
      });

      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = listAvailableRulepacks();
      expect(result).toEqual([
        path.join(packageDir, 'pii.yaml'),
        path.join(packageDir, 'security.yaml'),
      ]);
    });

    it('should return empty array if no rulepacks found', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = listAvailableRulepacks();
      expect(result).toEqual([]);
    });

    it('should handle directory read errors gracefully', () => {
      const rulepackDir = path.resolve(process.cwd(), 'rulepacks');

      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath === rulepackDir;
      });

      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = listAvailableRulepacks();
      expect(result).toEqual([]);
    });
  });

  describe('Cross-platform path handling', () => {
    it('should handle Windows-style paths', () => {
      const windowsPath = 'rulepacks\\pii.yaml';
      const normalizedPath = path.resolve(process.cwd(), windowsPath);

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === normalizedPath;
      });

      const result = resolveRulepackPath(windowsPath);
      expect(result).toBe(normalizedPath);
    });

    it('should handle Unix-style paths', () => {
      const unixPath = 'rulepacks/pii.yaml';
      const normalizedPath = path.resolve(process.cwd(), unixPath);

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === normalizedPath;
      });

      const result = resolveRulepackPath(unixPath);
      expect(result).toBe(normalizedPath);
    });
  });
});
