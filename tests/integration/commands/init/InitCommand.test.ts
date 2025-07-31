import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { InitCommandHandler } from '../../../../src/application/commands/init/InitCommandHandler';
import { InitCommand } from '../../../../src/application/commands/init/InitCommand';
import { createInitConfig } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('InitCommand Integration', () => {
  let container: Container;
  let handler: InitCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<InitCommandHandler>('initCommandHandler');

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

  describe('initialize configuration', () => {
    test('should create default configuration file', async () => {
      const projectDir = path.join(tempDir, 'default-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        template: 'default',
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Check that config file was created
      const configFile = path.join(projectDir, 'promptshield.config.json');
      expect(fs.existsSync(configFile)).toBe(true);

      // Verify config content
      const configContent = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      expect(configContent.version).toBeDefined();
      expect(configContent.rulepacks).toBeDefined();
      expect(configContent.scan).toBeDefined();
    });

    test('should create configuration with custom template', async () => {
      const projectDir = path.join(tempDir, 'custom-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        template: 'security-focused',
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const configFile = path.join(projectDir, 'promptshield.config.json');
      expect(fs.existsSync(configFile)).toBe(true);

      const configContent = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      expect(configContent.rulepacks).toContain('rulepacks/pii.yaml');
      expect(configContent.rulepacks).toContain('rulepacks/security.yaml');
    });

    test('should create gitignore entries', async () => {
      const projectDir = path.join(tempDir, 'gitignore-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        addGitignore: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const gitignoreFile = path.join(projectDir, '.gitignore');
      if (fs.existsSync(gitignoreFile)) {
        const gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8');
        expect(gitignoreContent).toContain('# PromptShield');
        expect(gitignoreContent).toContain('.promptshield/');
      }
    });
  });

  describe('initialize project structure', () => {
    test('should create project directories', async () => {
      const projectDir = path.join(tempDir, 'project-structure');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        createDirectories: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Check that standard directories were created
      expect(fs.existsSync(path.join(projectDir, 'data'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'output'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'rulepacks'))).toBe(true);
    });

    test('should create sample files', async () => {
      const projectDir = path.join(tempDir, 'sample-files');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        createSamples: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Check for sample data file
      const sampleDataFile = path.join(
        projectDir,
        'data',
        'sample-conversations.json'
      );
      expect(fs.existsSync(sampleDataFile)).toBe(true);

      // Verify sample content
      const sampleData = JSON.parse(fs.readFileSync(sampleDataFile, 'utf8'));
      expect(Array.isArray(sampleData)).toBe(true);
      expect(sampleData.length).toBeGreaterThan(0);
    });

    test('should create README with instructions', async () => {
      const projectDir = path.join(tempDir, 'readme-project');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        createReadme: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const readmeFile = path.join(projectDir, 'README.md');
      expect(fs.existsSync(readmeFile)).toBe(true);

      const readmeContent = fs.readFileSync(readmeFile, 'utf8');
      expect(readmeContent).toContain('PromptShield');
      expect(readmeContent).toContain('Getting Started');
      expect(readmeContent).toContain('promptshield scan');
    });
  });

  describe('rulepack management', () => {
    test('should copy built-in rulepacks', async () => {
      const projectDir = path.join(tempDir, 'rulepack-copy');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        copyRulepacks: ['pii', 'security'],
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Check that rulepacks were copied
      const rulepacksDir = path.join(projectDir, 'rulepacks');
      expect(fs.existsSync(path.join(rulepacksDir, 'pii.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(rulepacksDir, 'security.yaml'))).toBe(
        true
      );
    });

    test('should create custom rulepack template', async () => {
      const projectDir = path.join(tempDir, 'custom-rulepack');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        createCustomRulepack: true,
        rulepackName: 'my-custom-rules',
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const customRulepack = path.join(
        projectDir,
        'rulepacks',
        'my-custom-rules.yaml'
      );
      expect(fs.existsSync(customRulepack)).toBe(true);

      const rulepackContent = fs.readFileSync(customRulepack, 'utf8');
      expect(rulepackContent).toContain('version:');
      expect(rulepackContent).toContain('name: my-custom-rules');
      expect(rulepackContent).toContain('rules:');
    });
  });

  describe('interactive mode', () => {
    test('should handle non-interactive initialization', async () => {
      const projectDir = path.join(tempDir, 'non-interactive');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        interactive: false,
        template: 'minimal',
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.configCreated).toBe(true);
      expect(result.value.interactive).toBe(false);
    });

    test('should validate template selection', async () => {
      const projectDir = path.join(tempDir, 'template-validation');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        template: 'invalid-template' as any,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('template');
    });
  });

  describe('error handling', () => {
    test('should handle existing configuration file', async () => {
      const projectDir = path.join(tempDir, 'existing-config');
      fs.mkdirSync(projectDir, { recursive: true });

      // Create existing config file
      const configFile = path.join(projectDir, 'promptshield.config.json');
      fs.writeFileSync(configFile, '{"version": "1.0.0"}');

      const config = createInitConfig({
        directory: projectDir,
        force: false,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('already exists');
    });

    test('should overwrite with force flag', async () => {
      const projectDir = path.join(tempDir, 'force-overwrite');
      fs.mkdirSync(projectDir, { recursive: true });

      // Create existing config file
      const configFile = path.join(projectDir, 'promptshield.config.json');
      fs.writeFileSync(configFile, '{"version": "0.1.0"}');

      const config = createInitConfig({
        directory: projectDir,
        force: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Config should be updated
      const configContent = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      expect(configContent.version).not.toBe('0.1.0');
    });

    test('should handle permission errors', async () => {
      const config = createInitConfig({
        directory: '/root/read-only-directory',
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('permission');
    });

    test('should handle invalid directory', async () => {
      const config = createInitConfig({
        directory: '/dev/null/invalid',
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('configuration validation', () => {
    test('should validate created configuration', async () => {
      const projectDir = path.join(tempDir, 'config-validation');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        validate: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.configValid).toBe(true);
    });

    test('should provide configuration summary', async () => {
      const projectDir = path.join(tempDir, 'config-summary');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        verbose: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.summary).toBeDefined();
      expect(result.value.summary.filesCreated).toBeGreaterThan(0);
      expect(result.value.summary.directoriesCreated).toBeGreaterThan(0);
    });
  });

  describe('workspace integration', () => {
    test('should detect and integrate with existing package.json', async () => {
      const projectDir = path.join(tempDir, 'npm-integration');
      fs.mkdirSync(projectDir, { recursive: true });

      // Create package.json
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {},
      };
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const config = createInitConfig({
        directory: projectDir,
        integrateNpm: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // Check that scripts were added
      const updatedPackageJson = JSON.parse(
        fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8')
      );
      expect(updatedPackageJson.scripts['scan']).toBeDefined();
      expect(updatedPackageJson.scripts['validate']).toBeDefined();
    });

    test('should create VS Code settings for project', async () => {
      const projectDir = path.join(tempDir, 'vscode-integration');
      fs.mkdirSync(projectDir, { recursive: true });

      const config = createInitConfig({
        directory: projectDir,
        createVscodeSettings: true,
      });

      const command = new InitCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const vscodeDir = path.join(projectDir, '.vscode');
      expect(fs.existsSync(vscodeDir)).toBe(true);

      const settingsFile = path.join(vscodeDir, 'settings.json');
      if (fs.existsSync(settingsFile)) {
        const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        expect(settings['promptshield.enabled']).toBe(true);
      }
    });
  });
});
