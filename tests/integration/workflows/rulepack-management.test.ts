import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../src/cli/bootstrap';
import { ListCommandHandler } from '../../../src/application/commands/list/ListCommandHandler';
import { ValidateCommandHandler } from '../../../src/application/commands/validate/ValidateCommandHandler';
import { ScanCommandHandler } from '../../../src/application/commands/scan/ScanCommandHandler';
import { ListCommand } from '../../../src/application/commands/list/ListCommand';
import { ValidateCommand } from '../../../src/application/commands/validate/ValidateCommand';
import { ScanCommand } from '../../../src/application/commands/scan/ScanCommand';
import {
  createListConfig,
  createValidateConfig,
  createScanConfig,
} from '../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Rulepack Management Workflow', () => {
  let container: Container;
  let listHandler: ListCommandHandler;
  let validateHandler: ValidateCommandHandler;
  let scanHandler: ScanCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    listHandler = container.resolve<ListCommandHandler>('listCommandHandler');
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

  test('should list, validate, and use rulepacks', async () => {
    // Step 1: List available rulepacks
    const listConfig = createListConfig({ type: 'rulepacks' });
    const listCommand = new ListCommand(listConfig);
    const listResult = await listHandler.execute(listCommand);

    expect(listResult.isOk()).toBe(true);
    expect(listResult.value.items.length).toBeGreaterThan(0);

    // Step 2: Select and validate a rulepack
    const selectedRulepack = listResult.value.items[0];
    const validateConfig = createValidateConfig();
    const validateCommand = new ValidateCommand(
      selectedRulepack.path,
      validateConfig
    );
    const validateResult = await validateHandler.execute(validateCommand);

    expect(validateResult.isOk()).toBe(true);
    expect(validateResult.value.isValid).toBe(true);

    // Step 3: Use the validated rulepack for scanning
    const testData = [
      { prompt: 'Contact info', response: 'Email: test@example.com' },
    ];
    const dataFile = path.join(tempDir, 'test-data.json');
    fs.writeFileSync(dataFile, JSON.stringify(testData));

    const scanConfig = createScanConfig({ rulepack: selectedRulepack.path });
    const scanCommand = new ScanCommand(dataFile, scanConfig);
    const scanResult = await scanHandler.execute(scanCommand);

    expect(scanResult.isOk()).toBe(true);
  });

  test('should manage custom rulepacks', async () => {
    // Create multiple custom rulepacks
    const rulepacks = [
      {
        name: 'high-severity',
        content: `
name: High Severity Rules
description: Rules for critical violations
version: 1.0.0
rules:
  - id: critical-ssn
    description: Detect SSN
    match_regex: ['\\d{3}-\\d{2}-\\d{4}']
    severity: critical
    category: pii`,
      },
      {
        name: 'medium-severity',
        content: `
name: Medium Severity Rules
description: Rules for medium violations
version: 1.0.0
rules:
  - id: medium-email
    description: Detect emails
    match_keywords: ['@gmail.com', '@yahoo.com']
    severity: medium
    category: pii`,
      },
    ];

    // Save rulepacks
    const rulepackPaths = [];
    for (const rp of rulepacks) {
      const path = `${tempDir}/${rp.name}.yaml`;
      fs.writeFileSync(path, rp.content.trim());
      rulepackPaths.push(path);
    }

    // Validate all rulepacks
    for (const rulepackPath of rulepackPaths) {
      const validateConfig = createValidateConfig();
      const validateCommand = new ValidateCommand(rulepackPath, validateConfig);
      const result = await validateHandler.execute(validateCommand);

      expect(result.isOk()).toBe(true);
      expect(result.value.isValid).toBe(true);
    }

    // Test with different severity filters
    const testData = [
      { text: 'SSN: 123-45-6789' },
      { text: 'Email: user@gmail.com' },
    ];
    const dataFile = path.join(tempDir, 'severity-test.json');
    fs.writeFileSync(dataFile, JSON.stringify(testData));

    // Scan with high severity rulepack
    const highSevConfig = createScanConfig({
      rulepack: rulepackPaths[0],
      severity: ['critical'],
    });
    const highSevCommand = new ScanCommand(dataFile, highSevConfig);
    const highSevResult = await scanHandler.execute(highSevCommand);

    expect(highSevResult.isOk()).toBe(true);
    expect(
      highSevResult.value.violations.every((v) => v.severity === 'critical')
    ).toBe(true);
  });
});
