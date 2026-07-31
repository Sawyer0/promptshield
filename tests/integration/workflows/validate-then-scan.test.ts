import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../src/cli/bootstrap';
import { ValidateCommandHandler } from '../../../src/application/commands/validate/ValidateCommandHandler';
import { ScanCommandHandler } from '../../../src/application/commands/scan/ScanCommandHandler';
import { ValidateCommand } from '../../../src/application/commands/validate/ValidateCommand';
import { ScanCommand } from '../../../src/application/commands/scan/ScanCommand';
import {
  createValidateConfig,
  createScanConfig,
} from '../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Validate Then Scan Workflow', () => {
  let container: Container;
  let validateHandler: ValidateCommandHandler;
  let scanHandler: ScanCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    validateHandler = container.resolve<ValidateCommandHandler>(
      'validateCommandHandler'
    );
    scanHandler = container.resolve<ScanCommandHandler>('scanCommandHandler');

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

  test('should validate input file before scanning', async () => {
    const testData = [
      { prompt: 'What is your email?', response: 'user@example.com' },
      { prompt: 'Phone number?', response: '555-1234' },
    ];

    const testFile = path.join(tempDir, 'valid-data.json');
    fs.writeFileSync(testFile, JSON.stringify(testData));

    // Step 1: Validate the input file
    const validateConfig = createValidateConfig();
    const validateCommand = new ValidateCommand(testFile, validateConfig);
    const validateResult = await validateHandler.execute(validateCommand);

    expect(validateResult.isOk()).toBe(true);
    expect(validateResult.value.isValid).toBe(true);

    // Step 2: Only scan if validation passes
    if (validateResult.value.isValid) {
      const scanConfig = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const scanCommand = new ScanCommand(testFile, scanConfig);
      const scanResult = await scanHandler.execute(scanCommand);

      expect(scanResult.isOk()).toBe(true);
      expect(scanResult.value.violations.length).toBeGreaterThan(0);
    }
  });

  test('should skip scanning if validation fails', async () => {
    const invalidJson = '{"prompt": "test", "response": incomplete}';
    const testFile = path.join(tempDir, 'invalid-data.json');
    fs.writeFileSync(testFile, invalidJson);

    // Step 1: Validate the input file
    const validateConfig = createValidateConfig();
    const validateCommand = new ValidateCommand(testFile, validateConfig);
    const validateResult = await validateHandler.execute(validateCommand);

    expect(validateResult.isOk()).toBe(true);
    expect(validateResult.value.isValid).toBe(false);

    // Step 2: Skip scanning due to validation failure
    let scanExecuted = false;
    if (validateResult.value.isValid) {
      scanExecuted = true;
      // This block should not execute
    }

    expect(scanExecuted).toBe(false);
  });

  test('should validate rulepack before using it for scanning', async () => {
    // Create a custom rulepack
    const customRulepack = `
name: Custom Rules
description: Custom validation rules
version: 1.0.0
rules:
  - id: custom-email
    description: Detect email addresses
    match_regex: ['[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}']
    severity: medium
    category: pii
`;

    const rulepackPath = path.join(tempDir, 'custom-rules.yaml');
    fs.writeFileSync(rulepackPath, customRulepack);

    // Step 1: Validate the rulepack
    const validateConfig = createValidateConfig();
    const validateCommand = new ValidateCommand(rulepackPath, validateConfig);
    const validateResult = await validateHandler.execute(validateCommand);

    expect(validateResult.isOk()).toBe(true);
    expect(validateResult.value.isValid).toBe(true);

    // Step 2: Use the validated rulepack for scanning
    if (validateResult.value.isValid) {
      const testData = [{ text: 'Contact us at support@company.com' }];
      const dataFile = path.join(tempDir, 'data-to-scan.json');
      fs.writeFileSync(dataFile, JSON.stringify(testData));

      const scanConfig = createScanConfig({ rulepack: rulepackPath });
      const scanCommand = new ScanCommand(dataFile, scanConfig);
      const scanResult = await scanHandler.execute(scanCommand);

      expect(scanResult.isOk()).toBe(true);
      expect(scanResult.value.violations.length).toBeGreaterThan(0);
    }
  });
});







