import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../../src/application/commands/scan/ScanCommand';
import { createScanConfig, createScanContext } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('ScanCommand Integration', () => {
  let container: Container;
  let handler: ScanCommandHandler;
  let tempDir: string;

  beforeAll(async () => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ScanCommandHandler>('scanCommandHandler');

    // Create temp directory for test files
    tempDir = path.join(__dirname, '../../../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('scan command execution', () => {
    test('should scan JSON file successfully', async () => {
      const testData = [
        {
          prompt: 'What is your email?',
          response: 'My email is john@example.com',
        },
        { prompt: 'Tell me about yourself', response: 'I am an AI assistant' },
      ];

      const testFile = path.join(tempDir, 'test-data.json');
      fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        outputFormat: 'json',
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
      expect(result.value.violations[0].ruleId).toBeDefined();
      expect(result.value.metrics.objectsScanned).toBe(2);
    });

    test('should handle file not found error', async () => {
      const config = createScanConfig();
      const command = new ScanCommand('/nonexistent/file.json', config);

      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('not found');
    });

    test('should scan with severity filtering', async () => {
      const testData = [
        { prompt: 'My SSN is 123-45-6789', response: 'Thanks for sharing' },
        { prompt: 'Call me at 555-1234', response: 'Will do' },
      ];

      const testFile = path.join(tempDir, 'filtered-data.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        severity: ['critical', 'high'],
        outputFormat: 'json',
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // All violations should be critical or high severity
      result.value.violations.forEach((violation) => {
        expect(['critical', 'high']).toContain(violation.severity);
      });
    });

    test('should scan with field filtering', async () => {
      const testData = [
        {
          prompt: 'Email me at test@example.com',
          response: 'Contact secret@internal.com',
          metadata: 'admin@system.com',
        },
      ];

      const testFile = path.join(tempDir, 'field-filtered.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        fields: ['prompt'], // Only scan prompt field
        outputFormat: 'json',
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Violations should only be from prompt field
      result.value.violations.forEach((violation) => {
        expect(violation.field).toBe('prompt');
      });
    });

    test('should output in different formats', async () => {
      const testData = [{ prompt: 'Contact john@example.com', response: 'OK' }];
      const testFile = path.join(tempDir, 'format-test.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const formats = ['json', 'markdown', 'csv'] as const;

      for (const format of formats) {
        const config = createScanConfig({
          rulepack: 'rulepacks/pii.yaml',
          outputFormat: format,
        });

        const command = new ScanCommand(testFile, config);
        const result = await handler.execute(command);

        expect(result.isOk()).toBe(true);
        expect(result.value.violations.length).toBeGreaterThan(0);
      }
    });

    test('should handle empty files gracefully', async () => {
      const testFile = path.join(tempDir, 'empty.json');
      fs.writeFileSync(testFile, '[]');

      const config = createScanConfig();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations).toHaveLength(0);
      expect(result.value.metrics.objectsScanned).toBe(0);
    });
  });

  describe('error handling', () => {
    test('should handle malformed JSON', async () => {
      const testFile = path.join(tempDir, 'malformed.json');
      fs.writeFileSync(testFile, '{"invalid": json}');

      const config = createScanConfig();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('JSON');
    });

    test('should handle invalid rulepack', async () => {
      const testData = [{ prompt: 'test', response: 'test' }];
      const testFile = path.join(tempDir, 'test.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({
        rulepack: '/nonexistent/rules.yaml',
      });

      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('rulepack');
    });
  });

  describe('performance', () => {
    test('should handle moderately large files', async () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        prompt: `This is prompt ${i} with email user${i}@test.com`,
        response: `Response ${i}`,
      }));

      const testFile = path.join(tempDir, 'large.json');
      fs.writeFileSync(testFile, JSON.stringify(largeData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
      });

      const startTime = Date.now();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});







