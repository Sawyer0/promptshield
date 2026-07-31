import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ValidateCommandHandler } from '../../../../src/application/commands/validate/ValidateCommandHandler';
import { ValidateCommand } from '../../../../src/application/commands/validate/ValidateCommand';
import { createValidateConfig } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Input File Validation Integration', () => {
  let container: Container;
  let handler: ValidateCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ValidateCommandHandler>(
      'validateCommandHandler'
    );

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

  describe('JSON validation', () => {
    test('should validate valid JSON structure', async () => {
      const validJson = [
        { prompt: 'Test prompt', response: 'Test response' },
        { input: 'Test input', output: 'Test output' },
      ];

      const testFile = path.join(tempDir, 'valid.json');
      fs.writeFileSync(testFile, JSON.stringify(validJson));

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
      expect(result.value.errors).toHaveLength(0);
    });

    test('should detect malformed JSON', async () => {
      const testFile = path.join(tempDir, 'malformed.json');
      fs.writeFileSync(testFile, '{"invalid": json}');

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(result.value.errors.some((e) => e.code === 'INVALID_JSON')).toBe(
        true
      );
    });
  });

  describe('NDJSON validation', () => {
    test('should validate NDJSON format', async () => {
      const ndjsonContent = [
        '{"prompt": "Line 1", "response": "Response 1"}',
        '{"prompt": "Line 2", "response": "Response 2"}',
      ].join('\n');

      const testFile = path.join(tempDir, 'valid.ndjson');
      fs.writeFileSync(testFile, ndjsonContent);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
    });

    test('should detect invalid NDJSON lines', async () => {
      const ndjsonContent = [
        '{"prompt": "Valid line"}',
        '{"invalid": line}',
        '{"prompt": "Another valid line"}',
      ].join('\n');

      const testFile = path.join(tempDir, 'invalid.ndjson');
      fs.writeFileSync(testFile, ndjsonContent);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(false);
      expect(
        result.value.errors.some((e) => e.message.includes('Line 2'))
      ).toBe(true);
    });
  });

  describe('text file validation', () => {
    test('should validate text files', async () => {
      const textContent = 'This is a valid text file\nWith multiple lines';

      const testFile = path.join(tempDir, 'valid.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
    });

    test('should handle empty files', async () => {
      const testFile = path.join(tempDir, 'empty.txt');
      fs.writeFileSync(testFile, '');

      const config = createValidateConfig();
      const command = new ValidateCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.warnings.some((w) => w.code === 'EMPTY_FILE')).toBe(
        true
      );
    });
  });
});







