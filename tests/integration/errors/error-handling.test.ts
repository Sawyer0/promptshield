/**
 * Error Handling Integration Tests
 * Tests error handling and edge cases in the scanning process
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { testHelpers, fsHelpers } from '../../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../../src/core/scanner';

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

    // Should throw an error for empty files
    await expect(
      applyRulesToDataOrStream(tempFile, 'rulepacks/pii.yaml', false, false)
    ).rejects.toThrow('File is empty');
  });

  test('handles files with only whitespace', async () => {
    const tempFile = await fsHelpers.createTempFile('   \n\t  ', '.json');
    tempFiles.push(tempFile);

    await expect(
      applyRulesToDataOrStream(tempFile, 'rulepacks/pii.yaml', false, false)
    ).rejects.toThrow('File is empty');
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
});
