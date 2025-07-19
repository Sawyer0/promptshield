import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../../src/application/commands/scan/ScanCommand';
import { createScanConfig } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Scan NDJSON Files Integration', () => {
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

  describe('NDJSON format', () => {
    test('should scan basic NDJSON file', async () => {
      const ndjsonLines = [
        '{"prompt": "What is your email?", "response": "contact@example.com"}',
        '{"prompt": "Phone number?", "response": "Call me at 555-123-4567"}',
        '{"prompt": "Regular question", "response": "Normal response"}',
      ];

      const testFile = path.join(tempDir, 'basic.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
      expect(result.value.metrics.objectsScanned).toBe(3);
    });

    test('should auto-detect NDJSON format from extension', async () => {
      const ndjsonLines = [
        '{"text": "Email me at auto@detect.com"}',
        '{"text": "This is another line"}',
      ];

      const testFile = path.join(tempDir, 'auto-detect.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        // Don't explicitly set ndjsonMode
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(2);
    });

    test('should handle NDJSON with different object structures', async () => {
      const ndjsonLines = [
        '{"prompt": "Email question", "response": "user1@test.com"}',
        '{"input": "Phone question", "output": "555-0123", "metadata": {"type": "phone"}}',
        '{"message": "Contact admin@system.com", "timestamp": "2024-01-01"}',
      ];

      const testFile = path.join(tempDir, 'varied-structure.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(3);
    });
  });

  describe('streaming NDJSON', () => {
    test('should handle large NDJSON files with streaming', async () => {
      const ndjsonLines = Array.from({ length: 1000 }, (_, i) =>
        JSON.stringify({
          id: i,
          content: `Line ${i} with email user${i}@test.com`,
          timestamp: new Date().toISOString(),
        })
      );

      const testFile = path.join(tempDir, 'large.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
        streamingThreshold: 500,
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(1000);
      expect(result.value.metrics.streamingUsed).toBe(true);
    });

    test('should process NDJSON in batches', async () => {
      const ndjsonLines = Array.from({ length: 100 }, (_, i) =>
        JSON.stringify({
          message: `Message ${i} from contact${i}@batch.com`,
        })
      );

      const testFile = path.join(tempDir, 'batched.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
        batchSize: 25,
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(100);
    });
  });

  describe('NDJSON parsing errors', () => {
    test('should handle malformed NDJSON lines', async () => {
      const ndjsonLines = [
        '{"valid": "line"}',
        '{"invalid": json}', // Malformed line
        '{"another": "valid line"}',
      ];

      const testFile = path.join(tempDir, 'malformed.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({ ndjsonMode: true });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('line 2');
    });

    test('should handle empty NDJSON lines', async () => {
      const ndjsonLines = [
        '{"content": "First line"}',
        '', // Empty line
        '{"content": "Third line"}',
      ];

      const testFile = path.join(tempDir, 'empty-lines.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({ ndjsonMode: true });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(2); // Should skip empty line
    });
  });

  describe('NDJSON field filtering', () => {
    test('should filter fields in NDJSON objects', async () => {
      const ndjsonLines = [
        '{"prompt": "Email in prompt: p1@test.com", "response": "Email in response: r1@test.com", "meta": "Email in meta: m1@test.com"}',
        '{"prompt": "Phone in prompt: 555-0001", "response": "Phone in response: 555-0002", "meta": "Phone in meta: 555-0003"}',
      ];

      const testFile = path.join(tempDir, 'filtered-fields.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
        fields: ['prompt'], // Only scan prompt field
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // All violations should be from prompt field only
      result.value.violations.forEach((violation) => {
        expect(violation.field).toBe('prompt');
      });
    });
  });

  describe('memory efficiency', () => {
    test('should use minimal memory for large NDJSON files', async () => {
      const ndjsonLines = Array.from({ length: 2000 }, (_, i) =>
        JSON.stringify({
          line: i,
          data: `Some data with email line${i}@memory.test`,
        })
      );

      const testFile = path.join(tempDir, 'memory-test.ndjson');
      fs.writeFileSync(testFile, ndjsonLines.join('\n'));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        ndjsonMode: true,
        streamingThreshold: 100,
        memoryWarningThreshold: 0.7,
      });

      const startTime = Date.now();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(2000);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
