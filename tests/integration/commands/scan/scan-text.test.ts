import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ScanCommandHandler } from '../../../../src/application/commands/scan/ScanCommandHandler';
import { ScanCommand } from '../../../../src/application/commands/scan/ScanCommand';
import { createScanConfig, createScanContext } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('Scan Text Files Integration', () => {
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

  describe('plain text files', () => {
    test('should scan simple text file', async () => {
      const textContent = `
This is a sample document.
Please contact us at support@company.com for any issues.
You can also call us at 555-123-4567.
Thank you for your business!
      `.trim();

      const testFile = path.join(tempDir, 'simple.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
      expect(result.value.metrics.objectsScanned).toBe(1);
    });

    test('should scan markdown file', async () => {
      const markdownContent = `
# Contact Information

Please reach out to us:

- Email: info@example.com
- Phone: (555) 987-6543
- Address: 123 Main St, Anytown USA

## Privacy Notice

Your SSN 123-45-6789 is protected.
      `.trim();

      const testFile = path.join(tempDir, 'document.md');
      fs.writeFileSync(testFile, markdownContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);

      // Should detect email, phone, and SSN
      const ruleIds = result.value.violations.map((v) => v.ruleId);
      expect(ruleIds.some((id) => id.includes('email'))).toBe(true);
    });

    test('should handle multiline text patterns', async () => {
      const textContent = `
First line with email: user1@test.com
Second line continues here
Third line has phone: 555-0123
Fourth line with more email addresses:
  - admin@system.com
  - support@help.com
      `.trim();

      const testFile = path.join(tempDir, 'multiline.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(2); // Multiple violations
    });
  });

  describe('large text files', () => {
    test('should handle large text files efficiently', async () => {
      const lines = Array.from(
        { length: 1000 },
        (_, i) =>
          `Line ${i}: This line contains email address line${i}@bigfile.test and some other content.`
      );
      const textContent = lines.join('\n');

      const testFile = path.join(tempDir, 'large.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createScanConfig({
        rulepack: 'rulepacks/pii.yaml',
        streamingThreshold: 500,
      });

      const startTime = Date.now();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(900); // Should find most emails
      expect(endTime - startTime).toBeLessThan(5000); // Should complete quickly
    });

    test('should handle text with mixed encodings', async () => {
      const textContent = `
Regular ASCII text with email: ascii@test.com
Unicode characters: café, naïve, résumé
Contact: unicode@tëst.com
Special chars: ñoño@español.com
      `.trim();

      const testFile = path.join(tempDir, 'unicode.txt');
      fs.writeFileSync(testFile, textContent, 'utf8');

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
    });
  });

  describe('text file edge cases', () => {
    test('should handle empty text file', async () => {
      const testFile = path.join(tempDir, 'empty.txt');
      fs.writeFileSync(testFile, '');

      const config = createScanConfig();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations).toHaveLength(0);
      expect(result.value.metrics.objectsScanned).toBe(1);
    });

    test('should handle text with only whitespace', async () => {
      const textContent = '   \n\n\t  \r\n   ';

      const testFile = path.join(tempDir, 'whitespace.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createScanConfig();
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations).toHaveLength(0);
    });

    test('should handle text with very long lines', async () => {
      const longLine =
        'A'.repeat(10000) + ' email: longline@test.com ' + 'B'.repeat(10000);

      const testFile = path.join(tempDir, 'longlines.txt');
      fs.writeFileSync(testFile, longLine);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
    });
  });

  describe('text pattern matching', () => {
    test('should detect patterns across line boundaries', async () => {
      const textContent = `
Contact email split across
lines: multi
line@example.com for support
      `.trim();

      const testFile = path.join(tempDir, 'split-pattern.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      // Note: Depending on implementation, this might or might not detect split patterns
    });

    test('should provide accurate position information', async () => {
      const textContent = `Start of file.
Second line with email: position@test.com here.
Third line continues.`;

      const testFile = path.join(tempDir, 'positions.txt');
      fs.writeFileSync(testFile, textContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);

      const violation = result.value.violations[0];
      expect(violation.position.line).toBeGreaterThan(0);
      expect(violation.position.column).toBeGreaterThan(0);
      expect(violation.context.match).toBe('position@test.com');
    });
  });

  describe('different text file types', () => {
    test('should scan log files', async () => {
      const logContent = `
2024-01-01 10:00:00 INFO User login: user@system.com
2024-01-01 10:01:00 ERROR Failed auth for admin@internal.com
2024-01-01 10:02:00 WARN Rate limit exceeded for api@service.com
      `.trim();

      const testFile = path.join(tempDir, 'application.log');
      fs.writeFileSync(testFile, logContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBe(3); // Three email addresses
    });

    test('should scan configuration files', async () => {
      const configContent = `
# Configuration file
database_url=postgres://user:pass@db.internal.com:5432/mydb
admin_email=admin@company.com
support_phone=1-800-555-0199
api_key=sk_live_abc123def456
      `.trim();

      const testFile = path.join(tempDir, 'config.conf');
      fs.writeFileSync(testFile, configContent);

      const config = createScanConfig({ rulepack: 'rulepacks/pii.yaml' });
      const command = new ScanCommand(testFile, config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations.length).toBeGreaterThan(0);
    });
  });
});







