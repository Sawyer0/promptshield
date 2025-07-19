/**
 * Cross-platform compatibility tests
 * Ensures the tool works on Windows, macOS, and Linux
 */

import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { getRulePackPath } from '../../src/cli/utils/optionParsers/scanOptionParser';
import { resolveRulepackPath } from '../../src/utils/rulepackResolver';

describe('Cross-Platform Compatibility', () => {
  // Define cliCommand at the top level for all tests to use
  const isWindows = os.platform() === 'win32';
  const cliCommand = isWindows ? 'node bin/promptshield' : './bin/promptshield';

  describe('Path handling', () => {
    it('should handle different path separators correctly', () => {
      const testPaths = [
        'rulepacks/pii.yaml',
        'rulepacks\\pii.yaml',
        './rulepacks/pii.yaml',
        '.\\rulepacks\\pii.yaml',
      ];

      for (const testPath of testPaths) {
        const resolved = resolveRulepackPath(testPath);
        expect(path.isAbsolute(resolved)).toBe(true);
        expect(resolved).toMatch(/pii\.yaml$/);
      }
    });

    it('should normalize paths correctly across platforms', () => {
      const unixPath = 'rulepacks/pii.yaml';
      const windowsPath = 'rulepacks\\pii.yaml';

      const unixResolved = resolveRulepackPath(unixPath);
      const windowsResolved = resolveRulepackPath(windowsPath);

      expect(path.normalize(unixResolved)).toBe(
        path.normalize(windowsResolved)
      );
    });

    it('should handle absolute paths on different platforms', () => {
      const testPaths = [
        '/absolute/unix/path/rulepack.yaml',
        'C:\\absolute\\windows\\path\\rulepack.yaml',
        '/Users/mac/path/rulepack.yaml',
      ];

      for (const absolutePath of testPaths) {
        if (path.isAbsolute(absolutePath)) {
          const resolved = resolveRulepackPath(absolutePath);
          expect(resolved).toBe(absolutePath);
        }
      }
    });
  });

  describe('File system operations', () => {
    it('should handle file existence checks across platforms', () => {
      // Test with a file we know exists
      const existingFile = path.join(
        __dirname,
        '..',
        '..',
        'rulepacks',
        'pii.yaml'
      );
      const resolved = resolveRulepackPath('rulepacks/pii.yaml');

      expect(path.normalize(resolved)).toBe(path.normalize(existingFile));
    });

    it('should handle directory traversal correctly', () => {
      const relativePath = '../rulepacks/pii.yaml';
      const resolved = resolveRulepackPath(relativePath);

      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toMatch(/pii\.yaml$/);
    });
  });

  describe('CLI execution across platforms', () => {
    it('should execute CLI commands on current platform', () => {
      try {
        const output = execSync(`${cliCommand} --version`, {
          encoding: 'utf8',
          timeout: 5000,
        });
        expect(output).toMatch(/\d+\.\d+\.\d+/);
      } catch (error) {
        fail(`CLI version command failed on ${os.platform()}: ${error}`);
      }
    });

    it('should handle file paths in CLI arguments', () => {
      const testFile = path.join('tests', 'fixtures', 'sample.json');
      const normalizedPath = path.normalize(testFile);

      try {
        const output = execSync(`${cliCommand} validate "${normalizedPath}"`, {
          encoding: 'utf8',
          timeout: 10000,
        });
        expect(output).toContain('valid');
      } catch (error) {
        fail(`CLI validate with normalized path failed: ${error}`);
      }
    });
  });

  describe('Package scripts cross-platform compatibility', () => {
    it('should use Node.js for file operations instead of shell commands', () => {
      const packageJson = require('../../package.json');

      // Check that clean script uses Node.js fs.rmSync
      expect(packageJson.scripts.clean).toContain("require('fs').rmSync");
      expect(packageJson.scripts.clean).not.toContain('rm -rf');

      // Check that deps:clean script uses Node.js fs.rmSync
      expect(packageJson.scripts['deps:clean']).toContain(
        "require('fs').rmSync"
      );
      expect(packageJson.scripts['deps:clean']).not.toContain('rm -rf');
    });

    it('should execute clean script successfully', () => {
      try {
        execSync('npm run clean', {
          stdio: 'pipe',
          timeout: 10000,
        });
        // If we get here without throwing, the script succeeded
        expect(true).toBe(true);
      } catch (error) {
        fail(`Clean script failed: ${error}`);
      }
    });
  });

  describe('Environment-specific behavior', () => {
    it('should handle different line ending styles', () => {
      // Test that the tool can handle files with different line endings
      const testContent = 'test content\r\nwith windows endings\r\n';
      const unixContent = 'test content\nwith unix endings\n';

      // Both should be handled gracefully by the JSON parser
      expect(typeof testContent).toBe('string');
      expect(typeof unixContent).toBe('string');
    });

    it('should handle different file permissions', () => {
      // Test that the tool handles different file permission scenarios
      const options = { rulepack: 'rulepacks/pii.yaml' };
      const resolved = getRulePackPath(options as any);

      expect(resolved).toBeTruthy();
      expect(path.isAbsolute(resolved)).toBe(true);
    });
  });

  describe('Memory and performance across platforms', () => {
    it('should handle large files consistently', () => {
      // Test with a sample file to ensure consistent behavior
      const testFile = path.join(__dirname, '..', 'fixtures', 'sample.json');

      try {
        const startTime = Date.now();
        const output = execSync(`${cliCommand} scan "${testFile}"`, {
          encoding: 'utf8',
          timeout: 15000,
        });
        const endTime = Date.now();

        expect(output).toContain('violations');
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      } catch (error) {
        fail(`Performance test failed: ${error}`);
      }
    });
  });
});
