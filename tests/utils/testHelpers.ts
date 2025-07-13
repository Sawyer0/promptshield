import { promises as fsPromises } from 'fs';
import { Violation, ScanResult } from '../../src/types/core/rule';

/**
 * Test data preparation utilities
 */
export const testHelpers = {
  /**
   * Load and parse JSON test data
   */
  async loadTestData(filePath: string): Promise<any[]> {
    const data = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  },

  /**
   * Create test data string from JSON array
   */
  createTestDataString(jsonArray: any[]): string {
    return jsonArray.map((obj: Record<string, any>) => Object.values(obj).join(' ')).join(' ');
  },

  /**
   * Mock violation for testing
   */
  createMockViolation(overrides: Partial<Violation> = {}): Violation {
    return {
      ruleId: 'test-rule',
      message: 'Test violation',
      match: 'test-match',
      severity: 'medium',
      category: 'test',
      filePath: 'test-file',
      objectIndex: undefined,
      field: undefined,
      ...overrides,
    };
  },

  /**
   * Mock scan result for testing
   */
  createMockScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
    return {
      file: 'test-file',
      violations: [],
      durationMs: 0,
      ...overrides,
    };
  },

  /**
   * Assert that violations contain specific rule IDs
   */
  expectViolationsToContain(violations: Violation[], expectedRuleIds: string[]): void {
    const actualRuleIds = violations.map(v => v.ruleId);
    expectedRuleIds.forEach(ruleId => {
      expect(actualRuleIds).toContain(ruleId);
    });
  },

  /**
   * Assert that violations do not contain specific rule IDs
   */
  expectViolationsToNotContain(violations: Violation[], unexpectedRuleIds: string[]): void {
    const actualRuleIds = violations.map(v => v.ruleId);
    unexpectedRuleIds.forEach(ruleId => {
      expect(actualRuleIds).not.toContain(ruleId);
    });
  },

  /**
   * Get unique rule IDs from violations
   */
  getUniqueRuleIds(violations: Violation[]): string[] {
    return [...new Set(violations.map(v => v.ruleId))];
  },

  /**
   * Shared test data for common scenarios
   */
  testData: {
    validJsonArray: [
      { id: 'test1', prompt: 'Hello world', response: 'Hi there' },
      { id: 'test2', prompt: 'How are you?', response: 'I\'m good' }
    ],
    
    piiData: [
      { 
        id: 'pii-001', 
        prompt: 'Contact john.doe@example.com for details',
        response: 'Call 555-123-4567 or email jane.smith@company.com'
      }
    ],
    
    nestedData: [
      {
        id: 'nested-001',
        prompt: 'Hello',
        user: {
          profile: {
            email: 'user@example.com',
            phone: '555-987-6543'
          }
        }
      }
    ],
    
    malformedJson: '{"id": "test1", "prompt": "Hello world"', // Missing closing brace
    emptyJson: '',
    nonArrayJson: '{"id": "test1", "prompt": "Hello world"}',
  },

  /**
   * Common test assertions
   */
  assertions: {
    expectValidScanResult(result: ScanResult): void {
      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('durationMs');
      expect(Array.isArray(result.violations)).toBe(true);
    },

    expectValidViolation(violation: Violation): void {
      expect(violation).toHaveProperty('ruleId');
      expect(violation).toHaveProperty('message');
      expect(violation).toHaveProperty('match');
      expect(violation).toHaveProperty('severity');
      expect(violation).toHaveProperty('category');
      expect(violation).toHaveProperty('filePath');
    },

    expectNoViolations(results: ScanResult[]): void {
      results.forEach(result => {
        expect(result.violations).toHaveLength(0);
      });
    },

    expectHasViolations(results: ScanResult[]): void {
      results.forEach(result => {
        expect(result.violations.length).toBeGreaterThan(0);
      });
    }
  },


};

/**
 * NDJSON test utilities
 */
export const ndjsonHelpers = {
  /**
   * Create NDJSON string from array of objects
   */
  createNdjsonString(objects: any[]): string {
    return objects.map(obj => JSON.stringify(obj)).join('\n');
  },

  /**
   * Parse NDJSON string to array of objects
   */
  parseNdjsonString(ndjsonString: string): any[] {
    return ndjsonString
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => JSON.parse(line));
  },

  /**
   * Shared NDJSON test data
   */
  testData: {
    validNdjson: '{"prompt": "Hello", "response": "Hi"}\n{"prompt": "How are you?", "response": "Good"}',
    malformedNdjson: '{"prompt": "Hello"}\n{"response": "Hi",}\n{"prompt": "Test"}',
    emptyNdjson: '',
    singleLineNdjson: '{"prompt": "Hello", "response": "Hi"}'
  }
};

/**
 * CLI test utilities
 */
export const cliHelpers = {
  /**
   * Extract violations from CLI output
   */
  extractViolationsFromOutput(output: string): string[] {
    const lines = output.split('\n');
    const violations: string[] = [];
    
    for (const line of lines) {
      if (line.includes('**[') && line.includes(']**')) {
        // Extract rule ID from markdown format
        const match = line.match(/`([^`]+)`/);
        if (match) {
          violations.push(match[1]);
        }
      }
    }
    
    return violations;
  },

  /**
   * Check if CLI output contains specific error
   */
  outputContainsError(output: string, errorPattern: string | RegExp): boolean {
    return typeof errorPattern === 'string' 
      ? output.includes(errorPattern)
      : errorPattern.test(output);
  },

  /**
   * Common CLI test scenarios
   */
  scenarios: {
    basicScan: 'node bin/promptshield scan tests/fixtures/valid.json --rulepack rulepacks/pii.yaml',
    helpCommand: 'node bin/promptshield --help',
    versionCommand: 'node bin/promptshield --version',
    invalidCommand: 'node bin/promptshield invalid',
    missingFile: 'node bin/promptshield scan missing.json --rulepack rulepacks/pii.yaml',
    missingRulepack: 'node bin/promptshield scan tests/fixtures/valid.json --rulepack missing.yaml'
  }
};

/**
 * File system test utilities
 */
export const fsHelpers = {
  /**
   * Create temporary test file
   */
  async createTempFile(content: string, extension: string = '.json'): Promise<string> {
    const path = require('path');
    const tempPath = path.join(process.cwd(), `tests/fixtures/temp-${Date.now()}${extension}`);
    await fsPromises.writeFile(tempPath, content);
    return tempPath;
  },

  /**
   * Clean up specific temporary files (exact paths only)
   */
  async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fsPromises.unlink(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}; 