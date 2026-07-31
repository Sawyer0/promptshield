import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../src/application/commands/scan/ScanCommand';
import { createScanConfig, createScanContext } from '../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Parallel Processing Performance', () => {
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

  test('should process multiple files in parallel', async () => {
    // Create 10 test files
    const fileCount = 10;
    const files = [];

    for (let i = 0; i < fileCount; i++) {
      const data = Array.from({ length: 500 }, (_, j) => ({
        id: `${i}-${j}`,
        content: `File ${i} item ${j} email: file${i}_item${j}@parallel.test`,
      }));
      const file = path.join(tempDir, `parallel-${i}.json`);
      fs.writeFileSync(file, JSON.stringify(data));
      files.push(file);
    }

    // Sequential processing
    const sequentialStart = Date.now();
    const sequentialResults = [];
    for (const file of files) {
      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(file, config);
      const result = await handler.execute(command);
      sequentialResults.push(result);
    }
    const sequentialTime = Date.now() - sequentialStart;

    // Parallel processing
    const parallelStart = Date.now();
    const parallelPromises = files.map((file) => {
      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(file, config);
      return handler.execute(command);
    });
    const parallelResults = await Promise.all(parallelPromises);
    const parallelTime = Date.now() - parallelStart;

    expect(sequentialResults.every((r) => r.isOk())).toBe(true);
    expect(parallelResults.every((r) => r.isOk())).toBe(true);

    // Parallel should be faster
    expect(parallelTime).toBeLessThan(sequentialTime);

    // Results should be the same
    const sequentialViolations = sequentialResults.reduce(
      (sum, r) => sum + (r.isOk() ? r.value.violations.length : 0),
      0
    );
    const parallelViolations = parallelResults.reduce(
      (sum, r) => sum + (r.isOk() ? r.value.violations.length : 0),
      0
    );
    expect(parallelViolations).toBe(sequentialViolations);
  });

  test('should handle parallel rule matching efficiently', async () => {
    const testData = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      email: `user${i}@test.com`,
      phone: `555-${String(i).padStart(4, '0')}`,
      ssn: `123-45-${String(i).padStart(4, '0')}`,
      address: `${i} Main St, City, ST 12345`,
    }));

    const testFile = path.join(tempDir, 'multi-rule-parallel.json');
    fs.writeFileSync(testFile, JSON.stringify(testData));

    const config = createScanConfig({
      rulepack: 'rulepacks/pii.yaml',
      parallelRuleMatching: true,
    });

    const startTime = Date.now();
    const command = new ScanCommand(testFile, config);
    const result = await handler.execute(command);
    const endTime = Date.now();

    expect(result.isOk()).toBe(true);
    expect(result.value.violations.length).toBeGreaterThan(6000); // Multiple violations per object
    expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10s
  });

  test('should balance load across workers', async () => {
    // Create files with varying sizes
    const files = [
      { name: 'small.json', count: 100 },
      { name: 'medium.json', count: 1000 },
      { name: 'large.json', count: 5000 },
    ];

    for (const { name, count } of files) {
      const data = Array.from({ length: count }, (_, i) => ({
        content: `Item ${i} with email: size${count}_${i}@test.com`,
      }));
      const file = path.join(tempDir, name);
      fs.writeFileSync(file, JSON.stringify(data));
    }

    const startTime = Date.now();
    const promises = files.map(({ name }) => {
      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        workerThreads: true,
      });
      const command = new ScanCommand(path.join(tempDir, name), config);
      return handler.execute(command);
    });

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    expect(results.every((r) => r.isOk())).toBe(true);
    expect(totalTime).toBeLessThan(15000); // Efficient parallel processing

    // Verify all files were processed correctly
    expect(results[0].value.metrics.objectsScanned).toBe(100);
    expect(results[1].value.metrics.objectsScanned).toBe(1000);
    expect(results[2].value.metrics.objectsScanned).toBe(5000);
  });
});







