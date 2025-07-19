import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../src/application/commands/scan/ScanCommand';
import { createScanConfig } from '../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Memory Usage Performance', () => {
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

  test('should maintain stable memory with streaming', async () => {
    const largeNdjson = Array.from({ length: 20000 }, (_, i) =>
      JSON.stringify({
        id: i,
        data: `Memory test ${i} email: mem${i}@test.com`,
        payload: 'x'.repeat(200),
      })
    ).join('\n');

    const testFile = path.join(tempDir, 'memory-test.ndjson');
    fs.writeFileSync(testFile, largeNdjson);

    const initialMemory = process.memoryUsage().heapUsed;

    const config = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      ndjsonMode: true,
      streamingThreshold: 1000,
      batchSize: 100,
    });

    const command = new ScanCommand(testFile, config);
    const result = await handler.execute(command);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    expect(result.isOk()).toBe(true);
    expect(result.value.metrics.streamingUsed).toBe(true);
    expect(memoryIncrease).toBeLessThan(200); // Less than 200MB increase
  });

  test('should handle memory warnings', async () => {
    const data = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      largeField: 'x'.repeat(1000),
      email: `memory${i}@warning.test`,
    }));

    const testFile = path.join(tempDir, 'memory-warning.json');
    fs.writeFileSync(testFile, JSON.stringify(data));

    const config = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      memoryWarningThreshold: 0.1, // Very low threshold
      streamingThreshold: 1000,
    });

    const command = new ScanCommand(testFile, config);
    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    expect(result.value.metrics.memoryWarnings).toBeGreaterThan(0);
  });

  test('should handle multiple concurrent scans', async () => {
    const files = [];
    for (let i = 0; i < 3; i++) {
      const data = Array.from({ length: 1000 }, (_, j) => ({
        content: `Concurrent ${i}-${j} email: concurrent${i}_${j}@test.com`,
      }));
      const file = path.join(tempDir, `concurrent-${i}.json`);
      fs.writeFileSync(file, JSON.stringify(data));
      files.push(file);
    }

    const startMemory = process.memoryUsage().heapUsed;

    // Run scans concurrently
    const promises = files.map((file) => {
      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(file, config);
      return handler.execute(command);
    });

    const results = await Promise.all(promises);

    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // MB

    expect(results.every((r) => r.isOk())).toBe(true);
    expect(memoryUsed).toBeLessThan(300); // Reasonable memory usage for concurrent scans
  });
});
