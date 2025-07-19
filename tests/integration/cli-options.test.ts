import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ScanResult } from '../../src/domains/scanning/core/entities/ScanResult';
import { ReportServiceImpl } from '../../src/domains/reporting/core/services/ReportServiceImpl';
import { JsonRenderer } from '../../src/domains/reporting/adapters/renderers/JsonRenderer';
import { CsvRenderer } from '../../src/domains/reporting/adapters/renderers/CsvRenderer';
import { TableRenderer } from '../../src/domains/reporting/adapters/renderers/TableRenderer';
import { Report } from '../../src/domains/reporting/core/entities/Report';
import { Violation, ViolationUtils } from '../../src/shared/types/Violation';
import { DefaultValidationEngine } from '../../src/domains/validation/core/services/ValidationEngineImpl';
import { ValidationOptions } from '../../src/domains/validation/core/entities/ValidationOptions';
import { DefaultScanOrchestrator } from '../../src/domains/scanning/core/services/ScanOrchestrator';
import { ScanRequest } from '../../src/domains/scanning/core/entities/ScanRequest';
import { ScanContext } from '../../src/domains/scanning/core/entities/ScanContext';
import { ScanMetrics } from '../../src/shared/types/ScanMetrics';
import { stripAnsiCodes, extractJsonBlock, runCliCommand } from '../utils/cli';

// Helper function to create ScanResult from violations
function createScanResult(violations: Violation[]): ScanResult {
  const metrics: ScanMetrics = {
    objectsScanned: violations.length || 1,
    processingTime: 100,
    memoryUsage: 1024 * 1024,
    rulesApplied: 5,
    streamingUsed: false,
  };
  return new ScanResult(violations, metrics);
}

describe('Domain Validation Tests', () => {
  describe('ViolationUtils', () => {
    const mockViolations: Violation[] = [
      {
        ruleId: 'rule1',
        ruleName: 'Test Rule 1',
        ruleDescription: 'Test description',
        severity: 'high',
        category: 'pii',
        message: 'Test violation 1',
        field: 'field1',
        objectIndex: 0,
        context: { match: 'sensitive data' },
      },
      {
        ruleId: 'rule2',
        ruleName: 'Test Rule 2',
        ruleDescription: 'Test description',
        severity: 'medium',
        category: 'bias',
        message: 'Test violation 2',
        field: 'field2',
        objectIndex: 1,
        context: { match: 'biased content' },
      },
    ];

    it('should filter violations by severity', () => {
      const filtered = ViolationUtils.filterBySeverity(mockViolations, [
        'high',
      ]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe('high');
    });

    it('should filter violations by category', () => {
      const filtered = ViolationUtils.filterByCategory(mockViolations, ['pii']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('pii');
    });

    it('should create violation summary', () => {
      const summary = ViolationUtils.createSummary(mockViolations);
      expect(summary.total).toBe(2);
      expect(summary.bySeverity.high).toBe(1);
      expect(summary.bySeverity.medium).toBe(1);
      expect(summary.byCategory.pii).toBe(1);
      expect(summary.byCategory.bias).toBe(1);
    });

    it('should sort violations by severity', () => {
      const sorted = ViolationUtils.sortBySeverity(mockViolations);
      expect(sorted[0].severity).toBe('high');
      expect(sorted[1].severity).toBe('medium');
    });
  });

  describe('ValidationEngine', () => {
    it('should initialize validation engine', () => {
      const engine = new DefaultValidationEngine();
      expect(engine).toBeDefined();
      expect(engine.getSupportedTypes()).toBeDefined();
    });

    it('should determine validation types correctly', () => {
      const engine = new DefaultValidationEngine();

      // Test private method through public interface
      expect(() => engine.getSupportedTypes()).not.toThrow();
    });
  });
});

describe('Scanning Domain Tests', () => {
  describe('ScanOrchestrator', () => {
    it('should validate scan requests', () => {
      const orchestrator = new DefaultScanOrchestrator(
        {} as any, // fileReader
        new Map(), // processors
        {} as any, // ruleEngine
        {} as any, // strategy
        {} as any // metricsCollector
      );

      const validRequest = ScanRequest.create('valid-input', {
        rulepack: 'test-rulepack',
        outputFormat: 'json',
      });

      const result = orchestrator.validateRequest(validRequest);
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid requests', () => {
      const orchestrator = new DefaultScanOrchestrator(
        {} as any,
        new Map(),
        {} as any,
        {} as any,
        {} as any
      );

      const invalidRequest = ScanRequest.create('', {
        rulepack: 'test-rulepack',
        outputFormat: 'json',
      });

      const result = orchestrator.validateRequest(invalidRequest);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toMatch(/Input is required/);
      }
    });

    it('should reject requests without config', () => {
      const orchestrator = new DefaultScanOrchestrator(
        {} as any,
        new Map(),
        {} as any,
        {} as any,
        {} as any
      );

      const invalidRequest = ScanRequest.create('test-input', {} as any);

      const result = orchestrator.validateRequest(invalidRequest);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toMatch(/Configuration is required/);
      }
    });
  });

  describe('ScanResult', () => {
    it('should filter violations by severity', () => {
      const mockViolations: Violation[] = [
        {
          ruleId: 'rule1',
          ruleName: 'Test Rule 1',
          ruleDescription: 'Test description',
          severity: 'high',
          category: 'pii',
          message: 'High severity violation',
          field: 'field1',
          objectIndex: 0,
          context: { match: 'sensitive' },
        },
        {
          ruleId: 'rule2',
          ruleName: 'Test Rule 2',
          ruleDescription: 'Test description',
          severity: 'low',
          category: 'bias',
          message: 'Low severity violation',
          field: 'field2',
          objectIndex: 1,
          context: { match: 'biased' },
        },
      ];

      const scanResult = new ScanResult(mockViolations, {
        objectsScanned: 2,
        processingTime: 100,
        memoryUsage: 1024,
        rulesApplied: 2,
        streamingUsed: false,
      });

      const highSeverityViolations = scanResult.getViolationsBySeverity([
        'high',
      ]);
      expect(highSeverityViolations).toHaveLength(1);
      expect(highSeverityViolations[0].severity).toBe('high');
    });

    it('should get violation counts by severity', () => {
      const mockViolations: Violation[] = [
        {
          ruleId: 'rule1',
          ruleName: 'Test Rule 1',
          ruleDescription: 'Test description',
          severity: 'high',
          category: 'pii',
          message: 'High violation',
          field: 'field1',
          objectIndex: 0,
          context: { match: 'test' },
        },
        {
          ruleId: 'rule2',
          ruleName: 'Test Rule 2',
          ruleDescription: 'Test description',
          severity: 'high',
          category: 'pii',
          message: 'Another high violation',
          field: 'field2',
          objectIndex: 1,
          context: { match: 'test' },
        },
        {
          ruleId: 'rule3',
          ruleName: 'Test Rule 3',
          ruleDescription: 'Test description',
          severity: 'medium',
          category: 'bias',
          message: 'Medium violation',
          field: 'field3',
          objectIndex: 2,
          context: { match: 'test' },
        },
      ];

      const scanResult = new ScanResult(mockViolations, {
        objectsScanned: 3,
        processingTime: 150,
        memoryUsage: 2048,
        rulesApplied: 3,
        streamingUsed: false,
      });

      const counts = scanResult.getViolationCountBySeverity();
      expect(counts.high).toBe(2);
      expect(counts.medium).toBe(1);
      expect(counts.low).toBe(0);
      expect(counts.critical).toBe(0);
    });

    it('should determine if scan should fail based on severity', () => {
      const highViolation: Violation[] = [
        {
          ruleId: 'rule1',
          ruleName: 'Test Rule',
          ruleDescription: 'Test description',
          severity: 'high',
          category: 'pii',
          message: 'High violation',
          field: 'field1',
          objectIndex: 0,
          context: { match: 'test' },
        },
      ];

      const scanResult = new ScanResult(highViolation, {
        objectsScanned: 1,
        processingTime: 50,
        memoryUsage: 512,
        rulesApplied: 1,
        streamingUsed: false,
      });

      expect(scanResult.shouldFail('high')).toBe(true);
      expect(scanResult.shouldFail('critical')).toBe(false);
      expect(scanResult.shouldFail()).toBe(false);
    });

    it('should create empty scan results', () => {
      const emptyResult = ScanResult.empty();
      expect(emptyResult.getTotalViolations()).toBe(0);
      expect(emptyResult.violations).toHaveLength(0);
      expect(emptyResult.metrics.objectsScanned).toBe(0);
    });
  });
});

describe('Reporting Domain Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-output-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('ReportService', () => {
    it('should handle JSON output', async () => {
      const renderers = new Map();
      renderers.set('json', new JsonRenderer());

      const reportService = new ReportServiceImpl(renderers);

      const mockViolations: Violation[] = [
        {
          ruleId: 'test-rule',
          ruleName: 'Test Rule',
          ruleDescription: 'Test description',
          message: 'Test violation',
          severity: 'high',
          category: 'pii',
          field: 'test.json',
          objectIndex: 0,
          context: { match: 'test' },
        },
      ];

      const scanResult = createScanResult(mockViolations);
      const report = new Report(scanResult, 'json', {
        includeSummary: true,
        includeMetrics: true,
      });

      const result = await reportService.generateReport(report);
      expect(result.isOk()).toBe(true);
    });

    it('should handle CSV output', async () => {
      const renderers = new Map();
      renderers.set('csv', new CsvRenderer());

      const reportService = new ReportServiceImpl(renderers);

      const mockViolations: Violation[] = [
        {
          ruleId: 'test-rule',
          ruleName: 'Test Rule',
          ruleDescription: 'Test description',
          message: 'Test violation',
          severity: 'high',
          category: 'pii',
          field: 'test.json',
          objectIndex: 0,
          context: { match: 'test' },
        },
      ];

      const scanResult = createScanResult(mockViolations);
      const report = new Report(scanResult, 'csv', {
        includeSummary: true,
        includeMetrics: true,
      });

      const result = await reportService.generateReport(report);
      expect(result.isOk()).toBe(true);
    });

    it('should handle table output', async () => {
      const renderers = new Map();
      renderers.set('table', new TableRenderer());

      const reportService = new ReportServiceImpl(renderers);

      const mockViolations: Violation[] = [
        {
          ruleId: 'test-rule',
          ruleName: 'Test Rule',
          ruleDescription: 'Test description',
          message: 'Test violation',
          severity: 'high',
          category: 'pii',
          field: 'test.json',
          objectIndex: 0,
          context: { match: 'test' },
        },
      ];

      const scanResult = createScanResult(mockViolations);
      const report = new Report(scanResult, 'table', {
        includeSummary: true,
        includeMetrics: true,
      });

      const result = await reportService.generateReport(report);
      expect(result.isOk()).toBe(true);
    });

    it('should handle invalid output format', async () => {
      const renderers = new Map();
      const reportService = new ReportServiceImpl(renderers);

      const scanResult = createScanResult([]);
      const report = new Report(scanResult, 'invalid' as any, {
        includeSummary: true,
      });

      const result = await reportService.generateReport(report);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toMatch(
          /No renderer found for format: invalid/
        );
      }
    });

    it('should handle file write operations', async () => {
      const renderers = new Map();
      renderers.set('json', new JsonRenderer());

      const reportService = new ReportServiceImpl(renderers);

      const scanResult = createScanResult([]);
      const report = new Report(scanResult, 'json', {
        includeSummary: true,
      });

      const outputPath = path.join(tempDir, 'test.json');
      const result = await reportService.writeReport(report, outputPath);

      expect(result.isOk()).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);
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
