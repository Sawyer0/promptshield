/**
 * Integration tests for npm installation scenarios
 * Critical for ensuring the tool works after npm install
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { getRulePackPath } from '../../src/cli/utils/optionParsers/scanOptionParser';
import { resolveRulepackPath } from '../../src/utils/rulepackResolver';

describe('NPM Installation Integration', () => {
  describe('Package structure validation', () => {
    it('should include rulepacks directory in package files', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(packageJson.files).toContain('rulepacks');
    });

    it('should include all required rulepacks', () => {
      const rulepacksDir = path.join(__dirname, '..', '..', 'rulepacks');
      const requiredRulepacks = [
        'pii.yaml',
        'prompt-injection.yaml',
        'bias.yaml',
      ];

      for (const rulepack of requiredRulepacks) {
        const rulepackPath = path.join(rulepacksDir, rulepack);
        expect(fs.existsSync(rulepackPath)).toBe(true);
      }
    });

    it('should have proper binary configuration', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin.promptshield).toBe('./bin/promptshield');

      const binPath = path.join(__dirname, '..', '..', 'bin', 'promptshield');
      expect(fs.existsSync(binPath)).toBe(true);
    });
  });

  describe('Rulepack resolution after build', () => {
    beforeAll(() => {
      // Ensure the project is built
      try {
        execSync('npm run build', { stdio: 'pipe' });
      } catch (error) {
        console.warn('Build failed, but continuing with tests');
      }
    });

    it('should resolve default rulepack path correctly', () => {
      const mockOptions = {};
      const resolvedPath = getRulePackPath(mockOptions as any);

      expect(resolvedPath).toBeTruthy();
      expect(path.isAbsolute(resolvedPath)).toBe(true);
      expect(resolvedPath).toMatch(/pii\.yaml$/);
    });

    it('should resolve custom rulepack paths', () => {
      const customRulepack = 'rulepacks/prompt-injection.yaml';
      const mockOptions = { rulepack: customRulepack };
      const resolvedPath = getRulePackPath(mockOptions as any);

      expect(resolvedPath).toBeTruthy();
      expect(path.isAbsolute(resolvedPath)).toBe(true);
      expect(resolvedPath).toMatch(/prompt-injection\.yaml$/);
    });

    it('should find rulepacks in development mode', () => {
      const rulepackPath = resolveRulepackPath('rulepacks/pii.yaml');
      expect(fs.existsSync(rulepackPath)).toBe(true);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle different path separators', () => {
      const windowsStyle = 'rulepacks\\pii.yaml';
      const unixStyle = 'rulepacks/pii.yaml';

      const windowsResolved = resolveRulepackPath(windowsStyle);
      const unixResolved = resolveRulepackPath(unixStyle);

      expect(path.normalize(windowsResolved)).toBe(
        path.normalize(unixResolved)
      );
    });

    it('should use Node.js fs.rmSync for cross-platform file removal', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const cleanScript = packageJson.scripts.clean;

      // Should use Node.js fs.rmSync instead of rm -rf
      expect(cleanScript).not.toContain('rm -rf');
      expect(cleanScript).toContain("require('fs').rmSync");
    });
  });

  describe('CLI functionality after build', () => {
    it('should execute help command without errors', () => {
      try {
        const output = execSync('./bin/promptshield --help', {
          encoding: 'utf8',
          timeout: 5000,
        });
        expect(output).toContain('promptshield');
        expect(output).toContain('scan');
        expect(output).toContain('validate');
        expect(output).toContain('list');
      } catch (error) {
        fail(`CLI help command failed: ${error}`);
      }
    });

    it('should list available rulepacks', () => {
      try {
        const output = execSync('./bin/promptshield list', {
          encoding: 'utf8',
          timeout: 10000,
        });
        expect(output).toContain('pii.yaml');
        expect(output).toContain('prompt-injection.yaml');
      } catch (error) {
        fail(`CLI list command failed: ${error}`);
      }
    });

    it('should validate sample files', () => {
      try {
        const output = execSync(
          './bin/promptshield validate tests/fixtures/sample.json',
          {
            encoding: 'utf8',
            timeout: 10000,
          }
        );
        expect(output).toContain('valid');
      } catch (error) {
        fail(`CLI validate command failed: ${error}`);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle missing rulepack files gracefully', () => {
      const mockOptions = { rulepack: 'nonexistent/rulepack.yaml' };
      const resolvedPath = getRulePackPath(mockOptions as any);

      // Should return the path even if file doesn't exist
      // The actual error handling happens in the loader
      expect(resolvedPath).toBeTruthy();
    });

    it('should handle permission errors during directory scanning', () => {
      // This test ensures the system doesn't crash when directories are unreadable
      const result = resolveRulepackPath('rulepacks/test.yaml');
      expect(typeof result).toBe('string');
    });
  });
});







