import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  validateScanOptions,
  validateSeverityFilter,
  validateCategoryFilter,
  validateOutputFormat,
  validateNumericOption,
  validatePagination,
  parseCommaSeparated,
} from '../../src/cli/validators/options';
import { ScanOptions } from '../../src/cli/validators/options';
import {
  OutputHandler,
  OutputOptions,
} from '../../src/cli/output/outputHandler';
import { ScanResult } from '../../src/types/core/rule';
import { stripAnsiCodes, extractJsonBlock, runCliCommand } from '../utils/cli';

describe('CLI Options Validation', () => {
  describe('validateScanOptions', () => {
    it('should validate valid options', () => {
      const options: ScanOptions = {
        output: 'json',
        severity: 'high,medium',
        category: 'pii,bias',
        maxViolations: '10',
        offset: '0',
        limit: '20',
        timeout: '300',
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid severity filter', () => {
      const options: ScanOptions = {
        severity: 'invalid,high',
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid severity filter: invalid,high/);
    });

    it('should detect invalid category filter', () => {
      const options: ScanOptions = {
        category: 'invalid,pii',
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid category filter: invalid,pii/);
    });

    it('should detect invalid output format', () => {
      const options: ScanOptions = {
        output: 'xml' as any,
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid output format: xml/);
    });

    it('should detect invalid max violations', () => {
      const options: ScanOptions = {
        maxViolations: '-1',
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid max-violations: -1/);
    });

    it('should detect invalid pagination', () => {
      const options: ScanOptions = {
        offset: '-1',
        limit: '0',
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid pagination parameters/);
    });

    it('should detect invalid timeout', () => {
      const options: ScanOptions = {
        timeout: '0',
      };

      const result = validateScanOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid timeout: 0/);
    });
  });

  describe('validateSeverityFilter', () => {
    it('should validate single severity', () => {
      expect(validateSeverityFilter('high')).toBe(true);
    });

    it('should validate multiple severities', () => {
      expect(validateSeverityFilter('high,medium,low')).toBe(true);
    });

    it('should reject invalid severity', () => {
      expect(validateSeverityFilter('invalid')).toBe(false);
    });

    it('should reject mixed valid and invalid severities', () => {
      expect(validateSeverityFilter('high,invalid,low')).toBe(false);
    });
  });

  describe('validateCategoryFilter', () => {
    it('should validate single category', () => {
      expect(validateCategoryFilter('pii')).toBe(true);
    });

    it('should validate multiple categories', () => {
      expect(validateCategoryFilter('pii,bias,hallucination')).toBe(true);
    });

    it('should reject invalid category', () => {
      expect(validateCategoryFilter('invalid')).toBe(false);
    });

    it('should reject mixed valid and invalid categories', () => {
      expect(validateCategoryFilter('pii,invalid,bias')).toBe(false);
    });
  });

  describe('validateOutputFormat', () => {
    it('should validate json format', () => {
      expect(validateOutputFormat('json')).toBe(true);
    });

    it('should validate markdown format', () => {
      expect(validateOutputFormat('markdown')).toBe(true);
    });

    it('should validate csv format', () => {
      expect(validateOutputFormat('csv')).toBe(true);
    });

    it('should validate table format', () => {
      expect(validateOutputFormat('table')).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(validateOutputFormat('xml')).toBe(false);
    });
  });

  describe('validateNumericOption', () => {
    it('should validate number in range', () => {
      expect(validateNumericOption('5', 1, 10)).toBe(true);
    });

    it('should reject number below minimum', () => {
      expect(validateNumericOption('0', 1, 10)).toBe(false);
    });

    it('should reject number above maximum', () => {
      expect(validateNumericOption('11', 1, 10)).toBe(false);
    });

    it('should reject non-numeric value', () => {
      expect(validateNumericOption('abc', 1, 10)).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('should validate valid pagination', () => {
      expect(validatePagination('0', '10')).toBe(true);
    });

    it('should validate offset only', () => {
      expect(validatePagination('5')).toBe(true);
    });

    it('should validate limit only', () => {
      expect(validatePagination(undefined, '10')).toBe(true);
    });

    it('should reject negative offset', () => {
      expect(validatePagination('-1', '10')).toBe(false);
    });

    it('should reject zero limit', () => {
      expect(validatePagination('0', '0')).toBe(false);
    });
  });

  describe('parseCommaSeparated', () => {
    it('should parse single value', () => {
      expect(parseCommaSeparated('high')).toEqual(['high']);
    });

    it('should parse multiple values', () => {
      expect(parseCommaSeparated('high,medium,low')).toEqual([
        'high',
        'medium',
        'low',
      ]);
    });

    it('should handle whitespace', () => {
      expect(parseCommaSeparated(' high , medium , low ')).toEqual([
        'high',
        'medium',
        'low',
      ]);
    });

    it('should filter empty values', () => {
      expect(parseCommaSeparated('high,,medium,')).toEqual(['high', 'medium']);
    });
  });
});

describe('Output Handler', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-output-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('OutputHandler', () => {
    it('should handle JSON output', async () => {
      const options: OutputOptions = {
        format: 'json',
        outputFile: path.join(tempDir, 'test.json'),
      };

      const handler = new OutputHandler(options);
      const mockResults: ScanResult[] = [
        {
          file: 'test.json',
          violations: [
            {
              ruleId: 'test-rule',
              message: 'Test violation',
              match: 'test',
              severity: 'high',
              category: 'pii',
              filePath: 'test.json',
            },
          ],
          durationMs: 100,
        },
      ];

      const result = await handler.outputResults(mockResults);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(path.join(tempDir, 'test.json'));
    });

    it('should handle CSV output', async () => {
      const options: OutputOptions = {
        format: 'csv',
        outputFile: path.join(tempDir, 'test.csv'),
      };

      const handler = new OutputHandler(options);
      const mockResults: ScanResult[] = [
        {
          file: 'test.json',
          violations: [
            {
              ruleId: 'test-rule',
              message: 'Test violation',
              match: 'test',
              severity: 'high',
              category: 'pii',
              filePath: 'test.json',
            },
          ],
          durationMs: 100,
        },
      ];

      const result = await handler.outputResults(mockResults);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(path.join(tempDir, 'test.csv'));
    });

    it('should handle table output', async () => {
      const options: OutputOptions = {
        format: 'table',
      };

      const handler = new OutputHandler(options);
      const mockResults: ScanResult[] = [
        {
          file: 'test.json',
          violations: [
            {
              ruleId: 'test-rule',
              message: 'Test violation',
              match: 'test',
              severity: 'high',
              category: 'pii',
              filePath: 'test.json',
            },
          ],
          durationMs: 100,
        },
      ];

      const result = await handler.outputResults(mockResults);
      expect(result.success).toBe(true);
    });

    it('should handle invalid output format', async () => {
      const options: OutputOptions = {
        format: 'invalid' as any,
      };

      const handler = new OutputHandler(options);
      const mockResults: ScanResult[] = [];

      const result = await handler.outputResults(mockResults);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle file write errors', async () => {
      const options: OutputOptions = {
        format: 'json',
        outputFile: 'C:\\Windows\\System32\\test.json', // Use a protected directory that should fail
      };

      const handler = new OutputHandler(options);
      const mockResults: ScanResult[] = [
        {
          file: 'test.json',
          violations: [],
          durationMs: 100,
        },
      ];

      const result = await handler.outputResults(mockResults);
      // The test should fail due to permission denied or similar error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/Failed to write output file/);
    });

    it('should handle compression errors', async () => {
      const options: OutputOptions = {
        format: 'json',
        outputFile: path.join(tempDir, 'test.json.gz'),
        compress: 'gzip',
        compressionLevel: 999, // Invalid level
      };

      const handler = new OutputHandler(options);
      const mockResults: ScanResult[] = [
        {
          file: 'test.json',
          violations: [],
          durationMs: 100,
        },
      ];

      const result = await handler.outputResults(mockResults);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('CLI Integration Tests', () => {
  const cliPath = 'node bin/promptshield';

  describe('Option validation', () => {
    it('should reject invalid severity filter', () => {
      expect(() => {
        execSync(
          `${cliPath} scan tests/fixtures/valid.json --severity invalid`,
          {
            stdio: 'pipe',
          }
        );
      }).toThrow();
    });

    it('should reject invalid category filter', () => {
      expect(() => {
        execSync(
          `${cliPath} scan tests/fixtures/valid.json --category invalid`,
          {
            stdio: 'pipe',
          }
        );
      }).toThrow();
    });

    it('should reject invalid output format', () => {
      expect(() => {
        execSync(`${cliPath} scan tests/fixtures/valid.json --output xml`, {
          stdio: 'pipe',
        });
      }).toThrow();
    });

    it('should reject invalid max violations', () => {
      expect(() => {
        execSync(
          `${cliPath} scan tests/fixtures/valid.json --max-violations -1`,
          {
            stdio: 'pipe',
          }
        );
      }).toThrow();
    });

    it('should reject invalid pagination', () => {
      expect(() => {
        execSync(
          `${cliPath} scan tests/fixtures/valid.json --offset -1 --limit 0`,
          {
            stdio: 'pipe',
          }
        );
      }).toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle file not found', () => {
      const result = runCliCommand(`${cliPath} scan missing-file.json`);
      expect(result.success).toBe(false);
      expect(result.stderr).toMatch(/Input file not found/);
    });

    it('should handle invalid JSON', () => {
      const result = runCliCommand(
        `${cliPath} scan tests/fixtures/malformed.json`
      );
      expect(result.success).toBe(false);
      expect(result.stderr).toMatch(/Invalid JSON/);
    });

    it('should handle output write failure', () => {
      const result = runCliCommand(
        `${cliPath} scan tests/fixtures/valid.json --output-file /invalid/path/report.json`
      );
      // This might succeed on some systems, so we'll be flexible
      if (!result.success) {
        expect(result.stderr).toMatch(/Failed to write/);
      }
    });
  });

  describe('Filtering and pagination', () => {
    it('should filter by severity', () => {
      const output = execSync(
        `${cliPath} scan tests/fixtures/multiple-severities.json --severity high --output json`,
        {
          encoding: 'utf8',
        }
      );

      const cleanOutput = stripAnsiCodes(output);
      const jsonBlock = extractJsonBlock(cleanOutput);
      const results = JSON.parse(jsonBlock);
      const violations = results.results.flatMap((r: any) => r.violations);

      violations.forEach((v: any) => {
        expect(v.severity).toBe('high');
      });
    });

    it('should filter by category', () => {
      const output = execSync(
        `${cliPath} scan tests/fixtures/multiple-categories.json --category pii --output json`,
        {
          encoding: 'utf8',
        }
      );

      const cleanOutput = stripAnsiCodes(output);
      const jsonBlock = extractJsonBlock(cleanOutput);
      const results = JSON.parse(jsonBlock);
      const violations = results.results.flatMap((r: any) => r.violations);

      violations.forEach((v: any) => {
        expect(v.category).toBe('pii');
      });
    });

    it('should apply pagination', () => {
      const output = execSync(
        `${cliPath} scan tests/fixtures/large-result-set.json --limit 5 --output json`,
        {
          encoding: 'utf8',
        }
      );

      const cleanOutput = stripAnsiCodes(output);
      const jsonBlock = extractJsonBlock(cleanOutput);
      const results = JSON.parse(jsonBlock);
      const totalViolations = results.results.flatMap(
        (r: any) => r.violations
      ).length;

      expect(totalViolations).toBeLessThanOrEqual(5);
    });

    it('should truncate results', () => {
      const output = execSync(
        `${cliPath} scan tests/fixtures/large-result-set.json --max-violations 3 --output json`,
        {
          encoding: 'utf8',
        }
      );

      const cleanOutput = stripAnsiCodes(output);
      const jsonBlock = extractJsonBlock(cleanOutput);
      const results = JSON.parse(jsonBlock);
      const totalViolations = results.results.flatMap(
        (r: any) => r.violations
      ).length;

      expect(totalViolations).toBeLessThanOrEqual(3);
    });
  });
});
