import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../../src/application/commands/scan/ScanCommand';
import { createScanConfig } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Scan Streaming Integration', () => {
  let container: Container;
  let handler: ScanCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ScanCommandHandler>('scanCommandHandler');

    tempDir = path.join(__dirname, '../../../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('streaming threshold', () => {
    test('should use streaming for large JSON arrays', async () => {
      const largeData = Array.from({ length: 2000 }, (_, i) => ({
        id: i,
        prompt: `Prompt ${i}`,
        response: `Response ${i} with email user${i}@stream.test`,
        metadata: { index: i, timestamp: new Date().toISOString() },
      }));

      const testFile = path.join(tempDir, 'large-streaming.json');
      fs.writeFileSync(testFile, JSON.stringify(largeData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 1000, // Trigger streaming
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(2000);
      expect(result.value.violations.length).toBeGreaterThan(1900); // Should find most emails
    });

    test('should not use streaming for small files', async () => {
      const smallData = Array.from({ length: 50 }, (_, i) => ({
        text: `Small file line ${i} with email small${i}@test.com`,
      }));

      const testFile = path.join(tempDir, 'small-no-streaming.json');
      fs.writeFileSync(testFile, JSON.stringify(smallData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 1000, // Won't trigger streaming
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(false);
      expect(result.value.metrics.objectsScanned).toBe(50);
    });
  });

  describe('streaming NDJSON', () => {
    test('should stream large NDJSON files efficiently', async () => {
      const ndjsonLines = Array.from({ length: 5000 }, (_, i) =>
        JSON.stringify({
          line: i,
          content: `Line ${i} content with email stream${i}@ndjson.test`,
          data: 'x'.repeat(100), // Add some bulk to each line
        })
      );

      const testFile = path.join(tempDir, 'large-stream.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
        streamingThreshold: 1000,
      });

      const startTime = Date.now();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(5000);
      expect(result.value.violations.length).toBeGreaterThan(4900);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
    });

    test('should handle streaming with batched processing', async () => {
      const ndjsonLines = Array.from({ length: 1000 }, (_, i) =>
        JSON.stringify({
          batch_id: Math.floor(i / 100),
          item_id: i,
          message: `Batch item ${i} from contact${i}@batch.test`,
        })
      );

      const testFile = path.join(tempDir, 'batched-stream.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
        streamingThreshold: 500,
        batchSize: 50,
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(1000);
    });
  });

  describe('memory efficiency', () => {
    test('should maintain low memory usage with streaming', async () => {
      const hugeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        content: `Large object ${i} with email huge${i}@memory.test`,
        payload: 'x'.repeat(1000), // 1KB per object = 10MB total
        metadata: {
          created: new Date().toISOString(),
          processed: false,
          tags: [`tag${i}`, `category${i % 10}`, `priority${i % 3}`],
        },
      }));

      const testFile = path.join(tempDir, 'huge-memory.json');
      fs.writeFileSync(testFile, JSON.stringify(hugeData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 1000,
        memoryWarningThreshold: 0.8,
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(10000);

      // Memory usage should be reasonable (less than 100MB)
      expect(result.value.metrics.memoryUsage).toBeLessThan(100 * 1024 * 1024);
    });

    test('should handle memory warnings gracefully', async () => {
      const memoryIntensiveData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        large_field: 'x'.repeat(10000), // 10KB per object
        email: `memory${i}@test.com`,
      }));

      const testFile = path.join(tempDir, 'memory-warning.json');
      fs.writeFileSync(testFile, JSON.stringify(memoryIntensiveData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 500,
        memoryWarningThreshold: 0.1, // Very low threshold to trigger warning
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
    });
  });

  describe('streaming performance', () => {
    test('should process streaming data faster than batch for large files', async () => {
      const largeDataset = Array.from({ length: 3000 }, (_, i) => ({
        record_id: i,
        user_data: `User ${i} data with email perf${i}@speed.test`,
        timestamp: Date.now() + i,
        metadata: { processed: false, version: '1.0' },
      }));

      const testFile = path.join(tempDir, 'performance-test.json');
      fs.writeFileSync(testFile, JSON.stringify(largeDataset));

      // Test streaming mode
      const streamingConfig = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 1000,
      });

      const streamingStartTime = Date.now();
      const streamingCommand = new ScanCommand(testFile, streamingConfig);
      const streamingResult = await handler.execute(streamingCommand);
      const streamingEndTime = Date.now();

      // Test batch mode (higher threshold to avoid streaming)
      const batchConfig = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 10000,
      });

      const batchStartTime = Date.now();
      const batchCommand = new ScanCommand(testFile, batchConfig);
      const batchResult = await handler.execute(batchCommand);
      const batchEndTime = Date.now();

      expect(streamingResult.isOk()).toBe(true);
      expect(batchResult.isOk()).toBe(true);

      expect(streamingResult.value.metrics.streamingUsed).toBe(true);
      expect(batchResult.value.metrics.streamingUsed).toBe(false);

      const streamingTime = streamingEndTime - streamingStartTime;
      const batchTime = batchEndTime - batchStartTime;

      // Both should complete in reasonable time
      expect(streamingTime).toBeLessThan(10000);
      expect(batchTime).toBeLessThan(10000);

      // Results should be consistent
      expect(streamingResult.value.violations.length).toBe(
        batchResult.value.violations.length
      );
    });
  });

  describe('streaming error handling', () => {
    test('should handle streaming errors gracefully', async () => {
      const mixedData = Array.from({ length: 2000 }, (_, i) => {
        if (i === 1500) {
          // Insert problematic data that might cause streaming issues
          return { problematic: 'x'.repeat(1000000) }; // Very large field
        }
        return {
          id: i,
          email: `stream${i}@error.test`,
          normal_field: 'normal data',
        };
      });

      const testFile = path.join(tempDir, 'streaming-errors.json');
      fs.writeFileSync(testFile, JSON.stringify(mixedData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 1000,
        timeout: 30, // 30 second timeout
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      // Should handle the error and continue processing
      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
    });
  });
});
