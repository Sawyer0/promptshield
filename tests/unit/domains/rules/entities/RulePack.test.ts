import { describe, test, expect } from '@jest/globals';
import { RulePack } from '../../../../../src/domains/rules/core/entities/RulePack';
import { Rule } from '../../../../../src/domains/rules/core/entities/Rule';
import { createRule } from '../../../../helpers/testFactories';

describe('RulePack', () => {
  describe('constructor', () => {
    test('should create rulepack with all parameters', () => {
      const rules = [createRule({ id: 'rule1' }), createRule({ id: 'rule2' })];
      const lastUpdated = new Date('2024-01-15');

      const rulePack = new RulePack(
        'Test RulePack',
        'Test description',
        rules,
        '1.2.3',
        lastUpdated
      );

      expect(rulePack.name).toBe('Test RulePack');
      expect(rulePack.description).toBe('Test description');
      expect(rulePack.rules).toEqual(rules);
      expect(rulePack.version).toBe('1.2.3');
      expect(rulePack.lastUpdated).toBe(lastUpdated);
    });

    test('should create rulepack with empty rules array', () => {
      const rulePack = new RulePack(
        'Empty RulePack',
        'No rules',
        [],
        '1.0.0',
        new Date()
      );

      expect(rulePack.rules).toEqual([]);
      expect(rulePack.getRuleCount()).toBe(0);
    });
  });

  describe('getRuleCount', () => {
    test('should return correct total rule count', () => {
      const rules = [
        createRule({ id: 'rule1' }),
        createRule({ id: 'rule2' }),
        createRule({ id: 'rule3' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      expect(rulePack.getRuleCount()).toBe(3);
    });

    test('should return zero for empty rulepack', () => {
      const rulePack = new RulePack('test', 'test', [], '1.0.0', new Date());
      expect(rulePack.getRuleCount()).toBe(0);
    });
  });

  describe('getEnabledRules', () => {
    test('should return only enabled rules', () => {
      const rules = [
        createRule({ id: 'enabled1', enabled: true }),
        createRule({ id: 'disabled1', enabled: false }),
        createRule({ id: 'enabled2', enabled: true }),
        createRule({ id: 'disabled2', enabled: false }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const enabledRules = rulePack.getEnabledRules();

      expect(enabledRules).toHaveLength(2);
      expect(enabledRules.map((r) => r.id)).toEqual(['enabled1', 'enabled2']);
    });

    test('should return empty array when no rules enabled', () => {
      const rules = [
        createRule({ id: 'disabled1', enabled: false }),
        createRule({ id: 'disabled2', enabled: false }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      expect(rulePack.getEnabledRules()).toEqual([]);
    });

    test('should return all rules when all enabled', () => {
      const rules = [
        createRule({ id: 'enabled1', enabled: true }),
        createRule({ id: 'enabled2', enabled: true }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      expect(rulePack.getEnabledRules()).toHaveLength(2);
    });
  });

  describe('getRuleById', () => {
    test('should return rule when found', () => {
      const targetRule = createRule({ id: 'target-rule' });
      const rules = [
        createRule({ id: 'other-rule' }),
        targetRule,
        createRule({ id: 'another-rule' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const result = rulePack.getRuleById('target-rule');

      expect(result).toBe(targetRule);
    });

    test('should return undefined when rule not found', () => {
      const rules = [createRule({ id: 'existing-rule' })];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const result = rulePack.getRuleById('nonexistent-rule');

      expect(result).toBeUndefined();
    });

    test('should return undefined for empty rulepack', () => {
      const rulePack = new RulePack('test', 'test', [], '1.0.0', new Date());

      const result = rulePack.getRuleById('any-rule');

      expect(result).toBeUndefined();
    });
  });

  describe('getRulesByCategory', () => {
    test('should return rules matching category', () => {
      const rules = [
        createRule({ id: 'pii1', category: 'pii' }),
        createRule({ id: 'security1', category: 'security' }),
        createRule({ id: 'pii2', category: 'pii' }),
        createRule({ id: 'bias1', category: 'bias' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const piiRules = rulePack.getRulesByCategory('pii');

      expect(piiRules).toHaveLength(2);
      expect(piiRules.map((r) => r.id)).toEqual(['pii1', 'pii2']);
    });

    test('should return empty array when no rules match category', () => {
      const rules = [
        createRule({ id: 'pii1', category: 'pii' }),
        createRule({ id: 'security1', category: 'security' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const result = rulePack.getRulesByCategory('compliance');

      expect(result).toEqual([]);
    });
  });

  describe('getRulesBySeverity', () => {
    test('should return rules matching severity', () => {
      const rules = [
        createRule({ id: 'critical1', severity: 'critical' }),
        createRule({ id: 'high1', severity: 'high' }),
        createRule({ id: 'critical2', severity: 'critical' }),
        createRule({ id: 'medium1', severity: 'medium' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const criticalRules = rulePack.getRulesBySeverity('critical');

      expect(criticalRules).toHaveLength(2);
      expect(criticalRules.map((r) => r.id)).toEqual([
        'critical1',
        'critical2',
      ]);
    });

    test('should return empty array when no rules match severity', () => {
      const rules = [
        createRule({ id: 'medium1', severity: 'medium' }),
        createRule({ id: 'low1', severity: 'low' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const result = rulePack.getRulesBySeverity('critical');

      expect(result).toEqual([]);
    });
  });

  describe('hasRule', () => {
    test('should return true when rule exists', () => {
      const rules = [createRule({ id: 'existing-rule' })];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      expect(rulePack.hasRule('existing-rule')).toBe(true);
    });

    test('should return false when rule does not exist', () => {
      const rules = [createRule({ id: 'existing-rule' })];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      expect(rulePack.hasRule('nonexistent-rule')).toBe(false);
    });
  });

  describe('addRule', () => {
    test('should add new rule to rulepack', () => {
      const existingRule = createRule({ id: 'existing' });
      const rulePack = new RulePack(
        'test',
        'test',
        [existingRule],
        '1.0.0',
        new Date()
      );
      const newRule = createRule({ id: 'new-rule' });

      rulePack.addRule(newRule);

      expect(rulePack.getRuleCount()).toBe(2);
      expect(rulePack.hasRule('new-rule')).toBe(true);
      expect(rulePack.getRuleById('new-rule')).toBe(newRule);
    });

    test('should throw error when adding duplicate rule', () => {
      const existingRule = createRule({ id: 'duplicate' });
      const rulePack = new RulePack(
        'test',
        'test',
        [existingRule],
        '1.0.0',
        new Date()
      );
      const duplicateRule = createRule({ id: 'duplicate' });

      expect(() => rulePack.addRule(duplicateRule)).toThrow(
        'Rule with ID "duplicate" already exists'
      );
    });
  });

  describe('removeRule', () => {
    test('should remove existing rule', () => {
      const rule1 = createRule({ id: 'rule1' });
      const rule2 = createRule({ id: 'rule2' });
      const rulePack = new RulePack(
        'test',
        'test',
        [rule1, rule2],
        '1.0.0',
        new Date()
      );

      const removed = rulePack.removeRule('rule1');

      expect(removed).toBe(true);
      expect(rulePack.getRuleCount()).toBe(1);
      expect(rulePack.hasRule('rule1')).toBe(false);
      expect(rulePack.hasRule('rule2')).toBe(true);
    });

    test('should return false when removing nonexistent rule', () => {
      const rule1 = createRule({ id: 'rule1' });
      const rulePack = new RulePack(
        'test',
        'test',
        [rule1],
        '1.0.0',
        new Date()
      );

      const removed = rulePack.removeRule('nonexistent');

      expect(removed).toBe(false);
      expect(rulePack.getRuleCount()).toBe(1);
    });
  });

  describe('replaceRule', () => {
    test('should replace existing rule', () => {
      const originalRule = createRule({
        id: 'replaceable',
        description: 'Original',
      });
      const rulePack = new RulePack(
        'test',
        'test',
        [originalRule],
        '1.0.0',
        new Date()
      );
      const newRule = createRule({
        id: 'replaceable',
        description: 'Replaced',
      });

      const replaced = rulePack.replaceRule('replaceable', newRule);

      expect(replaced).toBe(true);
      expect(rulePack.getRuleById('replaceable')?.description).toBe('Replaced');
      expect(rulePack.getRuleCount()).toBe(1);
    });

    test('should return false when replacing nonexistent rule', () => {
      const rulePack = new RulePack('test', 'test', [], '1.0.0', new Date());
      const newRule = createRule({ id: 'nonexistent' });

      const replaced = rulePack.replaceRule('nonexistent', newRule);

      expect(replaced).toBe(false);
      expect(rulePack.getRuleCount()).toBe(0);
    });
  });

  describe('getCategories', () => {
    test('should return unique categories', () => {
      const rules = [
        createRule({ id: 'rule1', category: 'pii' }),
        createRule({ id: 'rule2', category: 'security' }),
        createRule({ id: 'rule3', category: 'pii' }),
        createRule({ id: 'rule4', category: 'bias' }),
        createRule({ id: 'rule5', category: 'security' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const categories = rulePack.getCategories();

      expect(categories).toHaveLength(3);
      expect(categories.sort()).toEqual(['bias', 'pii', 'security']);
    });

    test('should return empty array for empty rulepack', () => {
      const rulePack = new RulePack('test', 'test', [], '1.0.0', new Date());
      expect(rulePack.getCategories()).toEqual([]);
    });
  });

  describe('getSeverities', () => {
    test('should return unique severities', () => {
      const rules = [
        createRule({ id: 'rule1', severity: 'high' }),
        createRule({ id: 'rule2', severity: 'critical' }),
        createRule({ id: 'rule3', severity: 'high' }),
        createRule({ id: 'rule4', severity: 'medium' }),
        createRule({ id: 'rule5', severity: 'critical' }),
      ];
      const rulePack = new RulePack('test', 'test', rules, '1.0.0', new Date());

      const severities = rulePack.getSeverities();

      expect(severities).toHaveLength(3);
      expect(severities.sort()).toEqual(['critical', 'high', 'medium']);
    });

    test('should return empty array for empty rulepack', () => {
      const rulePack = new RulePack('test', 'test', [], '1.0.0', new Date());
      expect(rulePack.getSeverities()).toEqual([]);
    });
  });

  describe('clone', () => {
    test('should create independent copy', () => {
      const originalRules = [
        createRule({ id: 'rule1' }),
        createRule({ id: 'rule2' }),
      ];
      const original = new RulePack(
        'Original',
        'Original description',
        originalRules,
        '1.0.0',
        new Date()
      );

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.name).toBe(original.name);
      expect(cloned.description).toBe(original.description);
      expect(cloned.version).toBe(original.version);
      expect(cloned.lastUpdated).toBe(original.lastUpdated);
      expect(cloned.rules).toEqual(original.rules);
      expect(cloned.rules).not.toBe(original.rules); // Different array instance
    });

    test('should not affect original when modifying clone', () => {
      const original = new RulePack(
        'Original',
        'Description',
        [createRule()],
        '1.0.0',
        new Date()
      );
      const cloned = original.clone();

      cloned.addRule(createRule({ id: 'new-rule' }));

      expect(original.getRuleCount()).toBe(1);
      expect(cloned.getRuleCount()).toBe(2);
    });
  });

  describe('metadata', () => {
    test('should track last updated date', () => {
      const lastUpdated = new Date('2024-01-15T10:30:00Z');
      const rulePack = new RulePack('test', 'test', [], '1.0.0', lastUpdated);

      expect(rulePack.lastUpdated).toBe(lastUpdated);
    });

    test('should handle version strings', () => {
      const rulePack = new RulePack(
        'test',
        'test',
        [],
        '2.1.0-beta.3',
        new Date()
      );
      expect(rulePack.version).toBe('2.1.0-beta.3');
    });
  });

  describe('toString', () => {
    test('should return readable string representation', () => {
      const rules = [createRule({ id: 'rule1' }), createRule({ id: 'rule2' })];
      const rulePack = new RulePack(
        'Test Pack',
        'Description',
        rules,
        '1.0.0',
        new Date()
      );

      const str = rulePack.toString();

      expect(str).toContain('Test Pack');
      expect(str).toContain('1.0.0');
      expect(str).toContain('2 rules');
    });
  });
});
