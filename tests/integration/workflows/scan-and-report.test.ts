import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../src/application/commands/scan/ScanCommand';
import { createScanConfig, createScanContext } from '../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Scan and Report Workflow', () => {
  let container: Container;
  let scanHandler: ScanCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
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

  test('should scan and generate multiple format reports', async () => {
    const testData = [
      { prompt: 'Email me at test@example.com', response: 'OK' },
      { prompt: 'My SSN is 123-45-6789', response: 'Thanks' },
    ];

    const testFile = path.join(tempDir, 'test-data.json');
    fs.writeFileSync(testFile, JSON.stringify(testData));

    const formats = ['json', 'markdown', 'csv'] as const;
    const results = [];

    for (const format of formats) {
      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        outputFormat: format,
        outputFile: path.join(tempDir, `report.${format}`),
      });

      const command = new ScanCommand(testFile, config);
      const result = await scanHandler.execute(command);

      expect(result.isOk()).toBe(true);
      results.push(result.value);
    }

    // Verify all formats produced consistent results
    expect(results[0].violations.length).toBe(results[1].violations.length);
    expect(results[1].violations.length).toBe(results[2].violations.length);

    // Verify output files exist
    expect(fs.existsSync(path.join(tempDir, 'report.json'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'report.markdown'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'report.csv'))).toBe(true);
  });

  test('should scan multiple files and aggregate results', async () => {
    const files = [
      { name: 'file1.json', data: [{ text: 'Contact admin@test.com' }] },
      { name: 'file2.json', data: [{ text: 'Phone: 555-1234' }] },
      { name: 'file3.json', data: [{ text: 'No sensitive data here' }] },
    ];

    for (const file of files) {
      fs.writeFileSync(
        path.join(tempDir, file.name),
        JSON.stringify(file.data)
      );
    }

    const aggregatedResults = [];

    for (const file of files) {
      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(path.join(tempDir, file.name), config);
      const result = await scanHandler.execute(command);

      expect(result.isOk()).toBe(true);
      aggregatedResults.push(...result.value.violations);
    }

    expect(aggregatedResults.length).toBeGreaterThan(0);
    expect(aggregatedResults.some((v) => v.context.match.includes('@'))).toBe(
      true
    );
    expect(aggregatedResults.some((v) => v.context.match.includes('555'))).toBe(
      true
    );
  });
});







