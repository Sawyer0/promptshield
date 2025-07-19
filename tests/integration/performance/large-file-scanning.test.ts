import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../src/application/commands/scan/ScanCommand';
import { createScanConfig } from '../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Large File Scanning Performance', () => {
  let container: Container;
  let handler: ScanCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ScanCommandHandler>('scanCommandHandler');

    tempDir = path.join(__dirname, '../../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should handle 10MB JSON file efficiently', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      content: `Entry ${i} with email user${i}@performance.test`,
      metadata: {
        timestamp: new Date().toISOString(),
        data: 'x'.repeat(500), // ~500 bytes per object
      },
    }));

    const testFile = path.join(tempDir, 'large-10mb.json');
    fs.writeFileSync(testFile, JSON.stringify(largeData));

    const startTime = Date.now();
    const config = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      streamingThreshold: 5000,
    });

    const command = new ScanCommand(testFile, config);
    const result = await handler.execute(command);
    const endTime = Date.now();

    expect(result.isOk()).toBe(true);
    expect(result.value.metrics.objectsScanned).toBe(10000);
    expect(result.value.metrics.streamingUsed).toBe(true);
    expect(endTime - startTime).toBeLessThan(30000); // Complete within 30s
  });

  test('should handle deeply nested JSON efficiently', async () => {
    const createDeepObject = (depth: number, maxDepth: number): any => {
      if (depth >= maxDepth) {
        return { email: `deep${depth}@nested.test` };
      }
      return {
        level: depth,
        nested: createDeepObject(depth + 1, maxDepth),
        sibling: { email: `sibling${depth}@test.com` },
      };
    };

    const deepData = Array.from({ length: 100 }, (_, i) =>
      createDeepObject(0, 10)
    );

    const testFile = path.join(tempDir, 'deep-nested.json');
    fs.writeFileSync(testFile, JSON.stringify(deepData));

    const config = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      maxDepth: 15,
    });

    const command = new ScanCommand(testFile, config);
    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    expect(result.value.violations.length).toBeGreaterThan(0);
  });

  test('should compare streaming vs batch performance', async () => {
    const testData = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      message: `Performance test ${i} contact: perf${i}@test.com`,
    }));

    const testFile = path.join(tempDir, 'perf-comparison.json');
    fs.writeFileSync(testFile, JSON.stringify(testData));

    // Test with streaming
    const streamStart = Date.now();
    const streamConfig = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      streamingThreshold: 1000,
    });
    const streamCommand = new ScanCommand(testFile, streamConfig);
    const streamResult = await handler.execute(streamCommand);
    const streamTime = Date.now() - streamStart;

    // Test without streaming
    const batchStart = Date.now();
    const batchConfig = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      streamingThreshold: 10000,
    });
    const batchCommand = new ScanCommand(testFile, batchConfig);
    const batchResult = await handler.execute(batchCommand);
    const batchTime = Date.now() - batchStart;

    expect(streamResult.isOk()).toBe(true);
    expect(batchResult.isOk()).toBe(true);
    expect(streamResult.value.metrics.streamingUsed).toBe(true);
    expect(batchResult.value.metrics.streamingUsed).toBe(false);

    // Both should find same violations
    expect(streamResult.value.violations.length).toBe(
      batchResult.value.violations.length
    );
  });
});
