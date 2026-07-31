import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../../src/application/commands/scan/ScanCommand';
import { createScanConfig, createScanContext } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Scan JSON Files Integration', () => {
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

  describe('JSON array format', () => {
    test('should scan simple JSON array', async () => {
      const testData = [
        { prompt: 'What is your email?', response: 'test@example.com' },
        { prompt: 'Phone number?', response: '555-1234-5678' },
      ];

      const testFile = path.join(tempDir, 'simple-array.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
      expect(result.value.metrics.objectsScanned).toBe(2);
    });

    test('should scan nested JSON objects', async () => {
      const testData = [
        {
          conversation: {
            user: { message: 'My email is john@test.com' },
            assistant: { message: 'Thanks for sharing' },
          },
          metadata: { timestamp: '2024-01-01' },
        },
      ];

      const testFile = path.join(tempDir, 'nested.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        maxDepth: 3,
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
    });

    test('should handle JSON with mixed field types', async () => {
      const testData = [
        {
          id: 1,
          active: true,
          score: 95.5,
          tags: ['urgent', 'pii'],
          content: 'Contact support@company.com',
          metadata: null,
        },
      ];

      const testFile = path.join(tempDir, 'mixed-types.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
    });
  });

  describe('JSON object format', () => {
    test('should scan single JSON object', async () => {
      const testData = {
        prompt: 'What is your email address?',
        response: 'You can reach me at user@example.com',
      };

      const testFile = path.join(tempDir, 'single-object.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(1);
    });
  });

  describe('large JSON files', () => {
    test('should handle moderately large JSON arrays', async () => {
      const testData = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        prompt: `Prompt ${i}`,
        response: `Response ${i} - contact email${i}@test.com`,
      }));

      const testFile = path.join(tempDir, 'large-array.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        maxObjects: 1000,
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.objectsScanned).toBe(500);
      expect(result.value.violations.length).toBeGreaterThan(0);
    });
  });

  describe('JSON parsing errors', () => {
    test('should handle malformed JSON', async () => {
      const testFile = path.join(tempDir, 'malformed.json');
      fs.writeFileSync(testFile, '{"prompt": "test", "response":}');

      const config = createScanConfig();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('JSON');
    });

    test('should handle empty JSON file', async () => {
      const testFile = path.join(tempDir, 'empty.json');
      fs.writeFileSync(testFile, '');

      const config = createScanConfig();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('field-specific scanning', () => {
    test('should scan only specified fields', async () => {
      const testData = [
        {
          prompt: 'Email in prompt: test1@example.com',
          response: 'Email in response: test2@example.com',
          metadata: 'Email in metadata: test3@example.com',
        },
      ];

      const testFile = path.join(tempDir, 'field-specific.json');
      fs.writeFileSync(testFile, JSON.stringify(testData));

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        fields: ['prompt', 'response'], // Exclude metadata
      });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Should only find violations in prompt and response fields
      result.value.violations.forEach((violation) => {
        expect(['prompt', 'response']).toContain(violation.field);
      });
    });
  });
});







