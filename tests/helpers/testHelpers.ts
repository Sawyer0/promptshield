import fs from 'fs';
import path from 'path';
import { Violation } from '../../src/shared/types/Violation';
import { ScanMetrics } from '../../src/shared/types/ScanMetrics';
import { Rule } from '../../src/domains/rules/core/entities/Rule';
import { RulePack } from '../../src/domains/rules/core/entities/RulePack';

/**
 * Test helpers for the new domain-driven architecture
 */

/**
 * Creates a temporary directory for test files
 */
export function createTempTestDir(
  prefix: string = 'promptshield-test-'
): string {
  return fs.mkdtempSync(path.join(process.cwd(), prefix));
}

/**
 * Cleanup temporary directory
 */
export function cleanupTempDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Creates test fixtures in a temporary directory
 */
export function createTestFixtures(tempDir: string): {
  validJson: string;
  invalidJson: string;
  validNdjson: string;
  testText: string;
  validRulepack: string;
  invalidRulepack: string;
} {
  const fixturesDir = path.join(tempDir, 'fixtures');
  fs.mkdirSync(fixturesDir, { recursive: true });

  // Valid JSON file
  const validJsonPath = path.join(fixturesDir, 'valid.json');
  const validJsonData = {
    users: [
      { name: 'John Doe', ssn: '123-45-6789', email: 'john@example.com' },
      { name: 'Jane Smith', ssn: '987-65-4321', email: 'jane@example.com' },
    ],
    transactions: [
      {
        id: 1,
        amount: 1000,
        description: 'Payment from credit card 4111-1111-1111-1111',
      },
    ],
  };
  fs.writeFileSync(validJsonPath, JSON.stringify(validJsonData, null, 2));

  // Invalid JSON file
  const invalidJsonPath = path.join(fixturesDir, 'invalid.json');
  fs.writeFileSync(invalidJsonPath, '{ invalid json }');

  // Valid NDJSON file
  const validNdjsonPath = path.join(fixturesDir, 'valid.ndjson');
  const ndjsonLines = [
    JSON.stringify({ message: 'User login: admin password: admin123' }),
    JSON.stringify({
      message: 'Processing payment for card 4111-1111-1111-1111',
    }),
    JSON.stringify({ message: 'User SSN: 123-45-6789 updated' }),
  ];
  fs.writeFileSync(validNdjsonPath, ndjsonLines.join('\n'));

  // Test text file
  const testTextPath = path.join(fixturesDir, 'test.txt');
  const textContent = `
    This document contains sensitive information.
    User John Doe with SSN 123-45-6789 accessed the system.
    Credit card 4111-1111-1111-1111 was charged $500.
    The password is admin123 - please keep it secure.
  `;
  fs.writeFileSync(testTextPath, textContent);

  // Valid rulepack
  const validRulepackPath = path.join(fixturesDir, 'valid-rules.yaml');
  const validRulepackContent = `
version: "1.0"
metadata:
  name: "Test Rules"
  description: "Test ruleset for unit testing"
  version: "1.0.0"

rules:
  - id: "ssn-detection"
    name: "SSN Detection"
    description: "Detects Social Security Numbers"
    severity: "high"
    category: "pii"
    type: "regex"
    pattern: "\\\\b\\\\d{3}-\\\\d{2}-\\\\d{4}\\\\b"
    enabled: true

  - id: "credit-card-detection"
    name: "Credit Card Detection"
    description: "Detects credit card numbers"
    severity: "high"
    category: "pii"
    type: "regex"
    pattern: "\\\\b4[0-9]{3}(-?\\\\s?[0-9]{4}){3}\\\\b"
    enabled: true
`;
  fs.writeFileSync(validRulepackPath, validRulepackContent);

  // Invalid rulepack
  const invalidRulepackPath = path.join(fixturesDir, 'invalid-rules.yaml');
  fs.writeFileSync(invalidRulepackPath, 'invalid: yaml: content:');

  return {
    validJson: validJsonPath,
    invalidJson: invalidJsonPath,
    validNdjson: validNdjsonPath,
    testText: testTextPath,
    validRulepack: validRulepackPath,
    invalidRulepack: invalidRulepackPath,
  };
}

/**
 * Mock factories for domain entities
 */
export class MockFactories {
  /**
   * Creates a mock Violation
   */
  static createViolation(overrides: Partial<Violation> = {}): Violation {
    return {
      ruleId: 'test-rule',
      ruleName: 'Test Rule',
      ruleDescription: 'A test rule for unit testing',
      severity: 'high',
      category: 'pii',
      message: 'Test violation detected',
      field: 'test-field',
      objectIndex: 0,
      context: { match: 'test-match' },
      position: { start: 0, end: 10 },
      metadata: { confidence: 0.95 },
      ...overrides,
    };
  }

  /**
   * Creates multiple mock violations
   */
  static createViolations(
    count: number,
    overrides: Partial<Violation> = {}
  ): Violation[] {
    return Array.from({ length: count }, (_, i) =>
      this.createViolation({
        ruleId: `rule-${i}`,
        field: `field-${i}`,
        objectIndex: i,
        ...overrides,
      })
    );
  }

  /**
   * Creates mock ScanMetrics
   */
  static createScanMetrics(overrides: Partial<ScanMetrics> = {}): ScanMetrics {
    return {
      objectsScanned: 100,
      processingTime: 1500,
      memoryUsage: 1024 * 1024, // 1MB
      rulesApplied: 10,
      streamingUsed: false,
      ...overrides,
    };
  }

  /**
   * Creates a mock Rule
   */
  static createRule(
    overrides: Partial<{
      id: string;
      name: string;
      description: string;
      severity: string;
      category: string;
      type: string;
      pattern: string;
      enabled: boolean;
    }> = {}
  ): Rule {
    const defaults = {
      id: 'test-rule',
      name: 'Test Rule',
      description: 'A test rule',
      severity: 'high',
      category: 'pii',
      type: 'regex',
      pattern: '\\\\d{3}-\\\\d{2}-\\\\d{4}',
      enabled: true,
    };

    const config = { ...defaults, ...overrides };
    return new Rule(
      config.id,
      config.name,
      config.description,
      config.severity,
      config.category,
      config.type,
      config.pattern,
      config.enabled
    );
  }

  /**
   * Creates multiple mock rules
   */
  static createRules(count: number): Rule[] {
    return Array.from({ length: count }, (_, i) =>
      this.createRule({
        id: `rule-${i}`,
        name: `Rule ${i}`,
        category: ['pii', 'bias', 'data-leak'][i % 3],
      })
    );
  }

  /**
   * Creates a mock RulePack
   */
  static createRulePack(rules: Rule[] = []): RulePack {
    const metadata = {
      name: 'Test RulePack',
      description: 'A test rulepack',
      version: '1.0.0',
    };

    return new RulePack(
      metadata,
      rules.length > 0 ? rules : this.createRules(3)
    );
  }
}

/**
 * Test utilities for assertions
 */
export class TestUtils {
  /**
   * Checks if a violation matches expected criteria
   */
  static violationMatches(
    violation: Violation,
    criteria: Partial<Violation>
  ): boolean {
    return Object.entries(criteria).every(([key, value]) => {
      const violationValue = (violation as any)[key];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(violationValue) === JSON.stringify(value);
      }
      return violationValue === value;
    });
  }

  /**
   * Finds violations by rule ID
   */
  static findViolationsByRuleId(
    violations: Violation[],
    ruleId: string
  ): Violation[] {
    return violations.filter((v) => v.ruleId === ruleId);
  }

  /**
   * Counts violations by severity
   */
  static countViolationsBySeverity(
    violations: Violation[]
  ): Record<string, number> {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    violations.forEach((v) => {
      if (v.severity in counts) {
        counts[v.severity as keyof typeof counts]++;
      }
    });
    return counts;
  }

  /**
   * Asserts that a Result is Ok and returns the value
   */
  static assertOk<T, E>(result: { isOk(): boolean; value?: T; error?: E }): T {
    if (!result.isOk()) {
      throw new Error(`Expected Ok result, got Err: ${result.error}`);
    }
    return result.value!;
  }

  /**
   * Asserts that a Result is Err and returns the error
   */
  static assertErr<T, E>(result: {
    isErr(): boolean;
    value?: T;
    error?: E;
  }): E {
    if (!result.isErr()) {
      throw new Error(`Expected Err result, got Ok: ${result.value}`);
    }
    return result.error!;
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceUtils {
  /**
   * Measures execution time of an async function
   */
  static async measureTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; timeMs: number }> {
    const start = Date.now();
    const result = await fn();
    const timeMs = Date.now() - start;
    return { result, timeMs };
  }

  /**
   * Measures memory usage before and after a function
   */
  static async measureMemory<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; memoryDelta: number }> {
    const before = process.memoryUsage().heapUsed;
    const result = await fn();
    const after = process.memoryUsage().heapUsed;
    const memoryDelta = after - before;
    return { result, memoryDelta };
  }

  /**
   * Creates a large dataset for performance testing
   */
  static createLargeDataset(size: number): any[] {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      ssn: `${String(i).padStart(3, '0')}-${String(i % 100).padStart(2, '0')}-${String(i).padStart(4, '0')}`,
      data: `Some data content for user ${i} with various sensitive information`,
    }));
  }
}
