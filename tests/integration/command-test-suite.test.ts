import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { stripAnsiCodes, runCliCommand } from '../utils/cli';

describe('Command Test Suite', () => {
  const examplesDir = path.join(__dirname, '../../examples');
  const rulepacksDir = path.join(__dirname, '../../rulepacks');
  const outputDir = path.join(__dirname, '../fixtures/output');

  beforeEach(() => {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up output files
    const files = fs.readdirSync(outputDir);
    files.forEach((file) => {
      if (
        file.endsWith('.json') ||
        file.endsWith('.md') ||
        file.endsWith('.csv')
      ) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    });
  });

  describe('Scan Command Tests', () => {
    describe('Basic Scanning', () => {
      it('should scan sample-data.json with PII rules', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output json`
        );

        expect(result.success).toBe(true);
        expect(result.stdout).toContain('"violations"');
        expect(result.stdout).toContain('"email"');
        expect(result.stdout).toContain('"ssn"');
      });

      it('should scan ai_output.txt with PII rules', async () => {
        const inputFile = path.join(examplesDir, 'ai_output.txt');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output json`
        );

        expect(result.success).toBe(true);
        expect(result.stdout).toContain('"violations"');
        expect(result.stdout).toContain('"email"');
        expect(result.stdout).toContain('"ssn"');
      });

      it('should scan prompt-injection-attacks.json with prompt-injection rules', async () => {
        const inputFile = path.join(
          examplesDir,
          'prompt-injection-attacks.json'
        );
        const rulepack = path.join(rulepacksDir, 'prompt-injection.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output json`
        );

        expect(result.success).toBe(true);
        expect(result.stdout).toContain('"violations"');
        // Should detect prompt injection attempts
        expect(result.stdout).toContain('"ruleId"');
      });

      it('should scan hamed-test.json with hamed.yaml rules', async () => {
        const inputFile = path.join(examplesDir, 'hamed-test.json');
        const rulepack = path.join(examplesDir, 'hamed.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output json`
        );

        expect(result.success).toBe(true);
        expect(result.stdout).toContain('"violations"');
        // Should detect self-checkout security violations
        expect(result.stdout).toContain('"ruleId"');
      });
    });

    describe('Output Format Tests', () => {
      it('should output JSON format', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        expect(jsonOutput).toHaveProperty('results');
        expect(jsonOutput).toHaveProperty('metadata');
      });

      it('should output Markdown format', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output markdown`
        );

        expect(result.success).toBe(true);
        expect(result.stdout).toContain('# Scan Report');
        expect(result.stdout).toContain('| Severity | Rule | Message |');
      });

      it('should output CSV format', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output csv`
        );

        expect(result.success).toBe(true);
        expect(result.stdout).toContain(
          'rule_id,rule_description,severity,category'
        );
      });

      it('should output to file', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');
        const outputFile = path.join(outputDir, 'test-output.json');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --output json --output-file "${outputFile}"`
        );

        expect(result.success).toBe(true);
        expect(fs.existsSync(outputFile)).toBe(true);

        const fileContent = fs.readFileSync(outputFile, 'utf8');
        const jsonOutput = JSON.parse(fileContent);
        expect(jsonOutput).toHaveProperty('results');
      });
    });

    describe('Filtering Tests', () => {
      it('should filter by severity', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --severity high --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        const violations = jsonOutput.results[0].violations;

        violations.forEach((violation: any) => {
          expect(violation.severity).toBe('high');
        });
      });

      it('should filter by category', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --category pii --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        const violations = jsonOutput.results[0].violations;

        violations.forEach((violation: any) => {
          expect(violation.category).toBe('pii');
        });
      });

      it('should limit violations', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --max-violations 2 --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        const violations = jsonOutput.results[0].violations;

        expect(violations.length).toBeLessThanOrEqual(2);
      });
    });

    describe('Processing Options', () => {
      it('should scan specific fields', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --fields prompt,response --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
      });

      it('should scan entire object', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --scan-entire-object --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
      });

      it('should handle NDJSON mode', async () => {
        const inputFile = path.join(examplesDir, 'sample-data.json');
        const rulepack = path.join(rulepacksDir, 'pii.yaml');

        const result = await runCliCommand(
          `scan "${inputFile}" --rulepack "${rulepack}" --ndjson --output json`
        );

        expect(result.success).toBe(true);
        const jsonOutput = JSON.parse(result.stdout);
        expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('List Command Tests', () => {
    it('should list all rulepacks', async () => {
      const result = await runCliCommand('list');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Available RulePacks');
    });

    it('should list rules from specific rulepack', async () => {
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(`list --rulepack "${rulepack}"`);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Rules in');
    });

    it('should filter by category', async () => {
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `list --rulepack "${rulepack}" --category pii`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('pii');
    });

    it('should filter by severity', async () => {
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `list --rulepack "${rulepack}" --severity high`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('high');
    });

    it('should show only enabled rules', async () => {
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `list --rulepack "${rulepack}" --enabled-only`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Enabled Rules');
    });
  });

  describe('Init Command Tests', () => {
    const testRulepackPath = path.join(outputDir, 'test-rulepack.yaml');

    afterEach(() => {
      // Clean up test rulepack
      if (fs.existsSync(testRulepackPath)) {
        fs.unlinkSync(testRulepackPath);
      }
    });

    it('should create basic rulepack', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template basic`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('version:');
      expect(content).toContain('rules:');
    });

    it('should create PII rulepack', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template pii`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('pii');
    });

    it('should create security rulepack', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template security`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('security');
    });

    it('should create bias rulepack', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template bias`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('bias');
    });

    it('should create compliance rulepack', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template compliance`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('compliance');
    });

    it('should add description', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template basic --description "Test rulepack"`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('Test rulepack');
    });

    it('should add category', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template basic --category "test"`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(testRulepackPath)).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).toContain('test');
    });

    it('should force overwrite existing file', async () => {
      // Create initial file
      fs.writeFileSync(testRulepackPath, 'old content');

      const result = await runCliCommand(
        `init "${testRulepackPath}" --template basic --force`
      );

      expect(result.success).toBe(true);

      const content = fs.readFileSync(testRulepackPath, 'utf8');
      expect(content).not.toContain('old content');
      expect(content).toContain('version:');
    });

    it('should show verbose output', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template basic --verbose`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Creating rulepack');
    });

    it('should suppress output with quiet flag', async () => {
      const result = await runCliCommand(
        `init "${testRulepackPath}" --template basic --quiet`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle non-existent input file', async () => {
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "non-existent-file.json" --rulepack "${rulepack}" --output json`
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('error');
    });

    it('should handle non-existent rulepack', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "non-existent-rulepack.yaml" --output json`
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('error');
    });

    it('should handle invalid severity', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --severity invalid --output json`
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('error');
    });

    it('should handle invalid category', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --category invalid --output json`
      );

      expect(result.success).toBe(false);
      expect(result.stderr).toContain('error');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large files efficiently', async () => {
      const inputFile = path.join(examplesDir, 'hamed-test.json');
      const rulepack = path.join(examplesDir, 'hamed.yaml');

      const startTime = Date.now();
      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --output json`
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle parallel processing', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --parallel --output json`
      );

      expect(result.success).toBe(true);
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
    });

    it('should handle streaming threshold', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --streaming-threshold 1 --output json`
      );

      expect(result.success).toBe(true);
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
    });

    it('should handle memory warning threshold', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --memory-warning-threshold 0.5 --output json`
      );

      expect(result.success).toBe(true);
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work with multiple rulepacks', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const piiRulepack = path.join(rulepacksDir, 'pii.yaml');
      const biasRulepack = path.join(rulepacksDir, 'bias.yaml');

      // Test with PII rules
      const piiResult = await runCliCommand(
        `scan "${inputFile}" --rulepack "${piiRulepack}" --output json`
      );
      expect(piiResult.exitCode).toBe(0);

      // Test with bias rules
      const biasResult = await runCliCommand(
        `scan "${inputFile}" --rulepack "${biasRulepack}" --output json`
      );
      expect(biasResult.exitCode).toBe(0);
    });

    it('should handle compression', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');
      const outputFile = path.join(outputDir, 'compressed.json.gz');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --output json --output-file "${outputFile}" --compress gzip`
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should handle stdin input', async () => {
      const inputContent = fs.readFileSync(
        path.join(examplesDir, 'ai_output.txt'),
        'utf8'
      );
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `echo "${inputContent}" | scan - --rulepack "${rulepack}" --output json`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('"violations"');
    });

    it('should handle quiet mode', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --quiet --output json`
      );

      expect(result.success).toBe(true);
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput.results[0].violations.length).toBeGreaterThan(0);
    });

    it('should handle verbose mode', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --verbose --output json`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('"violations"');
    });

    it('should handle debug mode', async () => {
      const inputFile = path.join(examplesDir, 'sample-data.json');
      const rulepack = path.join(rulepacksDir, 'pii.yaml');

      const result = await runCliCommand(
        `scan "${inputFile}" --rulepack "${rulepack}" --debug --output json`
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('"violations"');
    });
  });
});







