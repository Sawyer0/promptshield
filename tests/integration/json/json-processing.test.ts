/**
 * JSON File Processing Integration Tests
 * Tests the core JSON file scanning functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { testHelpers, fsHelpers } from '../../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../../src/core/scanner';

describe('JSON File Processing Integration', () => {
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempFiles = [];
  });

  afterEach(async () => {
    await fsHelpers.cleanupTempFiles(tempFiles);
  });

  test('processes valid JSON files successfully', async () => {
    const validJson = JSON.stringify(testHelpers.testData.validJsonArray);
    const tempFile = await fsHelpers.createTempFile(validJson, '.json');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    expect(results).toHaveLength(1);
    testHelpers.assertions.expectValidScanResult(results[0]);
    testHelpers.assertions.expectNoViolations(results);
  });

  test('detects PII violations in JSON data', async () => {
    const piiJson = JSON.stringify(testHelpers.testData.piiData);
    const tempFile = await fsHelpers.createTempFile(piiJson, '.json');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    expect(results).toHaveLength(1);
    testHelpers.assertions.expectValidScanResult(results[0]);
    testHelpers.assertions.expectHasViolations(results);

    const violationTypes = testHelpers.getUniqueRuleIds(results[0].violations);
    expect(violationTypes).toContain('email');
    expect(violationTypes).toContain('phone');
  });

  test('handles malformed JSON gracefully', async () => {
    const tempFile = await fsHelpers.createTempFile(
      testHelpers.testData.malformedJson,
      '.json'
    );
    tempFiles.push(tempFile);

    // Should throw an error for malformed JSON
    await expect(
      applyRulesToDataOrStream(tempFile, 'rulepacks/pii.yaml', false, false)
    ).rejects.toThrow('Invalid JSON');
  });

  test('handles files with special characters', async () => {
    const specialData = [
      {
        id: 'special-001',
        prompt: 'Test with "quotes" and \'apostrophes\'',
        response: 'Response with \n newlines and \t tabs',
      },
    ];

    const specialJson = JSON.stringify(specialData);
    const tempFile = await fsHelpers.createTempFile(specialJson, '.json');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    expect(results).toHaveLength(1);
    testHelpers.assertions.expectValidScanResult(results[0]);
  });
});
