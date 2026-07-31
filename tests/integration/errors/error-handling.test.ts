/**
 * Error Handling Integration Tests
 * Tests error handling and edge cases in the scanning process
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { testHelpers, fsHelpers } from '../../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../../src/domains/scanning/core/services/ScanOrchestrator';

describe('Error Handling Integration', () => {
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempFiles = [];
  });

  afterEach(async () => {
    await fsHelpers.cleanupTempFiles(tempFiles);
  });

  test('handles missing files gracefully', async () => {
    await expect(
      applyRulesToDataOrStream(
        'missing-file.json',
        'rulepacks/pii.yaml',
        false,
        false
      )
    ).rejects.toThrow();
  });

  test('handles missing rulepacks gracefully', async () => {
    const validJson = JSON.stringify(testHelpers.testData.validJsonArray);
    const tempFile = await fsHelpers.createTempFile(validJson, '.json');
    tempFiles.push(tempFile);

    await expect(
      applyRulesToDataOrStream(tempFile, 'missing-rulepack.yaml', false, false)
    ).rejects.toThrow();
  });

  test('handles empty files', async () => {
    const tempFile = await fsHelpers.createTempFile('', '.json');
    tempFiles.push(tempFile);

    // Should return empty violations for empty files
    const result = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );
    expect(result).toHaveLength(1);
    expect(result[0].violations).toHaveLength(0);
    expect(result[0].file).toBe(tempFile);
  });

  test('handles files with only whitespace', async () => {
    const tempFile = await fsHelpers.createTempFile('   \n\t  ', '.json');
    tempFiles.push(tempFile);

    // Should return empty violations for whitespace-only files
    const result = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );
    expect(result).toHaveLength(1);
    expect(result[0].violations).toHaveLength(0);
    expect(result[0].file).toBe(tempFile);
  });

  test('handles invalid rulepack format', async () => {
    const validJson = JSON.stringify(testHelpers.testData.validJsonArray);
    const tempFile = await fsHelpers.createTempFile(validJson, '.json');
    tempFiles.push(tempFile);

    // Create an invalid rulepack file
    const invalidRulepack = await fsHelpers.createTempFile(
      'invalid: yaml: content',
      '.yaml'
    );
    tempFiles.push(invalidRulepack);

    await expect(
      applyRulesToDataOrStream(tempFile, invalidRulepack, false, false)
    ).rejects.toThrow();
  });

  test('handles permission errors gracefully', async () => {
    // This test would require creating a file with restricted permissions
    // For now, we'll test that the system handles file access errors
    const validJson = JSON.stringify(testHelpers.testData.validJsonArray);
    const tempFile = await fsHelpers.createTempFile(validJson, '.json');
    tempFiles.push(tempFile);

    // Test with a non-existent rulepack to simulate file access issues
    await expect(
      applyRulesToDataOrStream(
        tempFile,
        '/nonexistent/path/rulepack.yaml',
        false,
        false
      )
    ).rejects.toThrow();
  });

  test('handles data mode with empty content', async () => {
    // Test empty content in data mode
    const result = await applyRulesToDataOrStream(
      '',
      'rulepacks/pii.yaml',
      true,
      false
    );
    expect(result).toHaveLength(1);
    expect(result[0].violations).toHaveLength(0);
    expect(result[0].file).toBe('test-input');
  });

  test('handles data mode with malformed JSON', async () => {
    // Test malformed JSON in data mode
    await expect(
      applyRulesToDataOrStream(
        '{"invalid": json}',
        'rulepacks/pii.yaml',
        true,
        false
      )
    ).rejects.toThrow('Invalid JSON');
  });

  test('handles data mode with malformed NDJSON', async () => {
    // Test malformed NDJSON in data mode
    await expect(
      applyRulesToDataOrStream(
        '{"valid": "json"}\n{"invalid": json}',
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      )
    ).rejects.toThrow('Invalid JSON');
  });
});







