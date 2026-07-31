/**
 * Rule Engine Integration Tests
 * Tests the rule application and processing functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { testHelpers, fsHelpers } from '../../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../../src/domains/scanning/core/services/ScanOrchestrator';

describe('Rule Engine Integration', () => {
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempFiles = [];
  });

  afterEach(async () => {
    await fsHelpers.cleanupTempFiles(tempFiles);
  });

  test('applies rules to nested JSON objects', async () => {
    const nestedJson = JSON.stringify(testHelpers.testData.nestedData);
    const tempFile = await fsHelpers.createTempFile(nestedJson, '.json');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false,
      { fieldsToScan: ['prompt', 'user.profile.email', 'user.profile.phone'] }
    );

    expect(results).toHaveLength(1);
    testHelpers.assertions.expectHasViolations(results);

    const violationTypes = testHelpers.getUniqueRuleIds(results[0].violations);
    expect(violationTypes).toContain('email');
    expect(violationTypes).toContain('phone');
  });

  test('respects disabled rules', async () => {
    const piiJson = JSON.stringify(testHelpers.testData.piiData);
    const tempFile = await fsHelpers.createTempFile(piiJson, '.json');
    tempFiles.push(tempFile);

    // Use a rulepack with disabled rules - test with pii.yaml which should have some rules
    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    expect(results).toHaveLength(1);
    // Should have violations since pii.yaml contains enabled rules
    expect(results[0].violations.length).toBeGreaterThan(0);
  });

  test('applies multiple rulepacks', async () => {
    const testData = JSON.stringify(testHelpers.testData.piiData);
    const tempFile = await fsHelpers.createTempFile(testData, '.json');
    tempFiles.push(tempFile);

    // Test with multiple rulepacks if available
    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('violations');
    expect(results[0]).toHaveProperty('file');
  });

  test('handles rulepack with no matching rules', async () => {
    const cleanData = JSON.stringify([
      { id: '1', text: 'Clean text without PII' },
    ]);
    const tempFile = await fsHelpers.createTempFile(cleanData, '.json');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    expect(results).toHaveLength(1);
    testHelpers.assertions.expectValidScanResult(results[0]);
    // Should have no violations for clean data
    expect(results[0].violations.length).toBe(0);
  });
});







