/**
 * Performance Integration Tests
 * Tests performance characteristics and edge cases with large datasets
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import { fsHelpers } from '../../utils/testHelpers';
import { applyRulesToDataOrStream } from '../../../src/domains/scanning/core/services/ScanOrchestrator';

describe('Performance Integration', () => {
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempFiles = [];
  });

  afterEach(async () => {
    await fsHelpers.cleanupTempFiles(tempFiles);
  });

  test('handles large JSON files', async () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      prompt: `Prompt ${i}`,
      response: `Response ${i}`,
    }));

    const largeJson = JSON.stringify(largeData);
    const tempFile = await fsHelpers.createTempFile(largeJson, '.json');
    tempFiles.push(tempFile);

    const startTime = Date.now();
    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(1);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    expect(results[0].durationMs).toBeGreaterThan(0);
  });

  test('handles deeply nested JSON structures', async () => {
    const createNestedObject = (depth: number): any => {
      if (depth === 0) return { value: 'test@example.com' };
      return { nested: createNestedObject(depth - 1) };
    };

    const deeplyNested = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      data: createNestedObject(10), // 10 levels deep
    }));

    const nestedJson = JSON.stringify(deeplyNested);
    const tempFile = await fsHelpers.createTempFile(nestedJson, '.json');
    tempFiles.push(tempFile);

    const startTime = Date.now();
    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(1);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    expect(results[0].durationMs).toBeGreaterThan(0);
  });

  test('handles files with many small objects', async () => {
    const manySmallObjects = Array.from({ length: 5000 }, (_, i) => ({
      id: `obj-${i}`,
      text: `Object ${i} with some content`,
    }));

    const manyObjectsJson = JSON.stringify(manySmallObjects);
    const tempFile = await fsHelpers.createTempFile(manyObjectsJson, '.json');
    tempFiles.push(tempFile);

    // Verify file has content before scanning
    const fileContent = await fs.promises.readFile(tempFile, 'utf-8');
    expect(fileContent.length).toBeGreaterThan(0);

    const startTime = Date.now();
    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(1);
    expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
    expect(results[0].durationMs).toBeGreaterThan(0);
  });

  test('memory usage remains stable during processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const largeData = Array.from({ length: 2000 }, (_, i) => ({
      id: `item-${i}`,
      prompt: `Prompt ${i} with some content that might contain PII like test@example.com`,
      response: `Response ${i} with phone number 555-123-4567`,
    }));

    const largeJson = JSON.stringify(largeData);
    const tempFile = await fsHelpers.createTempFile(largeJson, '.json');
    tempFiles.push(tempFile);

    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(results).toHaveLength(1);
    // Memory increase should be reasonable (less than 100MB for this test)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });

  test('handles large NDJSON files efficiently', async () => {
    const ndjsonLines = Array.from({ length: 1000 }, (_, i) =>
      JSON.stringify({
        id: `line-${i}`,
        prompt: `Prompt ${i}`,
        response: `Response ${i}`,
      })
    ).join('\n');
    const tempFile = await fsHelpers.createTempFile(ndjsonLines, '.ndjson');
    tempFiles.push(tempFile);

    const initialMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();
    const results = await applyRulesToDataOrStream(
      tempFile,
      'rulepacks/pii.yaml',
      false,
      false
    );
    const duration = Date.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(results).toHaveLength(1);
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // <100MB
    expect(results[0].durationMs).toBeGreaterThan(0);
  });
});







