/**
 * NDJSON File Processing Integration Tests
 * Tests the NDJSON (Newline Delimited JSON) file scanning functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ndjsonHelpers, fsHelpers } from '../../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../../src/domains/scanning/core/services/ScanOrchestrator';

describe('NDJSON File Processing Integration', () => {
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempFiles = [];
  });

  afterEach(async () => {
    await fsHelpers.cleanupTempFiles(tempFiles);
  });

  test('processes valid NDJSON files', async () => {
    const tempFile = await fsHelpers.createTempFile(
      ndjsonHelpers.testData.validNdjson,
      '.ndjson'
    );
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false,
      { ndjsonMode: true }
    );

    expect(results).toHaveLength(1);
    // Add specific assertions for NDJSON processing
    expect(results[0]).toHaveProperty('file');
    expect(results[0]).toHaveProperty('violations');
    expect(results[0]).toHaveProperty('durationMs');
  });

  test('handles malformed NDJSON gracefully', async () => {
    const tempFile = await fsHelpers.createTempFile(
      ndjsonHelpers.testData.malformedNdjson,
      '.ndjson'
    );
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false,
      { ndjsonMode: true }
    );

    expect(results).toHaveLength(1);
    expect(results[0].violations.length).toBeGreaterThan(0);
  });

  test('processes empty NDJSON files', async () => {
    const tempFile = await fsHelpers.createTempFile('', '.ndjson');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false,
      { ndjsonMode: true }
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('file');
    expect(results[0]).toHaveProperty('violations');
    expect(results[0].violations).toHaveLength(0);
  });
});







