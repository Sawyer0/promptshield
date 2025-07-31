import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Container } from '../../../../src/infrastructure/container/Container';
import { setupContainer } from '../../../../src/cli/bootstrap';
import { ListCommandHandler } from '../../../../src/application/commands/list/ListCommandHandler';
import { ListCommand } from '../../../../src/application/commands/list/ListCommand';
import { createListConfig } from '../../../helpers/testFactories';
import * as path from 'path';
import * as fs from 'fs';

describe('ListCommand Integration', () => {
  let container: Container;
  let handler: ListCommandHandler;
  let tempDir: string;

  beforeAll(() => {
    container = new Container();
    setupContainer(container);
    handler = container.resolve<ListCommandHandler>('listCommandHandler');

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

  describe('list available rulepacks', () => {
    test('should list built-in rulepacks', async () => {
      const config = createListConfig({
        type: 'rulepacks',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.items.length).toBeGreaterThan(0);

      // Should include built-in rulepacks
      const rulepackNames = result.value.items.map((item) => item.name);
      expect(rulepackNames.some((name) => name.includes('pii'))).toBe(true);
    });

    test('should show rulepack details', async () => {
      const config = createListConfig({
        type: 'rulepacks',
        detailed: true,
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.items.length).toBeGreaterThan(0);

      const firstRulepack = result.value.items[0];
      expect(firstRulepack.name).toBeDefined();
      expect(firstRulepack.description).toBeDefined();
      expect(firstRulepack.version).toBeDefined();
      expect(firstRulepack.ruleCount).toBeGreaterThan(0);
    });

    test('should filter rulepacks by category', async () => {
      const config = createListConfig({
        type: 'rulepacks',
        category: 'pii',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // All returned rulepacks should relate to PII
      result.value.items.forEach((item) => {
        expect(
          item.name.toLowerCase().includes('pii') ||
            item.description.toLowerCase().includes('pii') ||
            item.categories.includes('pii')
        ).toBe(true);
      });
    });
  });

  describe('list rules in rulepack', () => {
    test('should list rules from specific rulepack', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.items.length).toBeGreaterThan(0);

      const firstRule = result.value.items[0];
      expect(firstRule.id).toBeDefined();
      expect(firstRule.description).toBeDefined();
      expect(firstRule.severity).toBeDefined();
      expect(firstRule.category).toBeDefined();
    });

    test('should filter rules by severity', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        severity: ['critical', 'high'],
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // All returned rules should be critical or high severity
      result.value.items.forEach((rule) => {
        expect(['critical', 'high']).toContain(rule.severity);
      });
    });

    test('should filter rules by enabled status', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        enabled: true,
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // All returned rules should be enabled
      result.value.items.forEach((rule) => {
        expect(rule.enabled).toBe(true);
      });
    });
  });

  describe('list supported formats', () => {
    test('should list supported input formats', async () => {
      const config = createListConfig({
        type: 'formats',
        category: 'input',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.items.length).toBeGreaterThan(0);

      const formatNames = result.value.items.map((item) => item.name);
      expect(formatNames).toContain('json');
      expect(formatNames).toContain('ndjson');
      expect(formatNames).toContain('text');
    });

    test('should list supported output formats', async () => {
      const config = createListConfig({
        type: 'formats',
        category: 'output',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.items.length).toBeGreaterThan(0);

      const formatNames = result.value.items.map((item) => item.name);
      expect(formatNames).toContain('json');
      expect(formatNames).toContain('markdown');
      expect(formatNames).toContain('csv');
      expect(formatNames).toContain('html');
    });
  });

  describe('output formatting', () => {
    test('should output in JSON format', async () => {
      const config = createListConfig({
        type: 'rulepacks',
        outputFormat: 'json',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.format).toBe('json');
      expect(result.value.items).toBeDefined();
    });

    test('should output in table format', async () => {
      const config = createListConfig({
        type: 'rulepacks',
        outputFormat: 'table',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.format).toBe('table');
    });

    test('should output in markdown format', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        outputFormat: 'markdown',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.format).toBe('markdown');
    });
  });

  describe('error handling', () => {
    test('should handle invalid rulepack path', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: '/nonexistent/rulepack.yaml',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('rulepack');
    });

    test('should handle invalid list type', async () => {
      const config = createListConfig({
        type: 'invalid' as any,
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('type');
    });

    test('should handle missing rulepack for rules listing', async () => {
      const config = createListConfig({
        type: 'rules',
        // Missing rulepack parameter
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('rulepack');
    });
  });

  describe('pagination and limits', () => {
    test('should respect limit parameter', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        limit: 5,
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.items.length).toBeLessThanOrEqual(5);
    });

    test('should handle offset parameter', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        offset: 2,
        limit: 3,
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);
      expect(result.value.metadata.offset).toBe(2);
      expect(result.value.metadata.limit).toBe(3);
    });
  });

  describe('search functionality', () => {
    test('should search rulepacks by name', async () => {
      const config = createListConfig({
        type: 'rulepacks',
        search: 'pii',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // All results should match the search term
      result.value.items.forEach((item) => {
        expect(
          item.name.toLowerCase().includes('pii') ||
            item.description.toLowerCase().includes('pii')
        ).toBe(true);
      });
    });

    test('should search rules by description', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        search: 'email',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      // At least some results should match email-related patterns
      expect(result.value.items.length).toBeGreaterThan(0);
    });
  });

  describe('sorting', () => {
    test('should sort rulepacks by name', async () => {
      const config = createListConfig({
        type: 'rulepacks',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const names = result.value.items.map((item) => item.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    test('should sort rules by severity', async () => {
      const config = createListConfig({
        type: 'rules',
        rulepack: 'rulepacks/pii.yaml',
        sortBy: 'severity',
        sortOrder: 'desc',
      });

      const command = new ListCommand(config);
      const result = await handler.execute(command);

      expect(result.isOk()).toBe(true);

      const severities = result.value.items.map((item) => item.severity);
      const severityOrder = ['critical', 'high', 'medium', 'low'];

      // Check that items are sorted by severity in descending order
      for (let i = 1; i < severities.length; i++) {
        const currentIndex = severityOrder.indexOf(severities[i]);
        const prevIndex = severityOrder.indexOf(severities[i - 1]);
        expect(currentIndex).toBeGreaterThanOrEqual(prevIndex);
      }
    });
  });
});
