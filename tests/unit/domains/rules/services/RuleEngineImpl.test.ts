import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { RuleEngineImpl } from '../../../../../src/domains/rules/core/services/RuleEngineImpl';
import { Rule } from '../../../../../src/domains/rules/core/entities/Rule';
import { RulePack } from '../../../../../src/domains/rules/core/entities/RulePack';
import { RuleRepository } from '../../../../../src/domains/rules/core/ports/RuleRepository';
import {
  createRule,
  createRulePack,
  createViolation,
} from '../../../../helpers/testFactories';
import { ok, err } from '../../../../../src/shared/types/Result';

describe('RuleEngineImpl', () => {
  let ruleEngine: RuleEngineImpl;
  let mockRepository: jest.Mocked<RuleRepository>;

  beforeEach(() => {
    mockRepository = {
      loadRulePack: jest.fn(),
      saveRulePack: jest.fn(),
      validateRulePack: jest.fn(),
      listRulePacks: jest.fn(),
    } as jest.Mocked<RuleRepository>;

    ruleEngine = new RuleEngineImpl(mockRepository);
  });

  describe('loadRulePack', () => {
    test('should load rulepack successfully', async () => {
      const rulePack = createRulePack();
      mockRepository.loadRulePack.mockResolvedValue(ok(rulePack));

      const result = await ruleEngine.loadRulePack('test-rulepack.yaml');

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(rulePack);
      expect(mockRepository.loadRulePack).toHaveBeenCalledWith(
        'test-rulepack.yaml'
      );
    });

    test('should handle repository errors', async () => {
      const error = new Error('Failed to load rulepack');
      mockRepository.loadRulePack.mockResolvedValue(err(error));

      const result = await ruleEngine.loadRulePack('invalid-rulepack.yaml');

      expect(result.isErr()).toBe(true);
      expect(result.error).toBe(error);
    });

    test('should handle repository exceptions', async () => {
      mockRepository.loadRulePack.mockRejectedValue(
        new Error('Repository exception')
      );

      const result = await ruleEngine.loadRulePack('test-rulepack.yaml');

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Failed to load RulePack');
    });
  });

  describe('validateRulePack', () => {
    test('should validate rulepack successfully', async () => {
      const validationResult = { isValid: true, errors: [], warnings: [] };
      mockRepository.validateRulePack.mockResolvedValue(ok(validationResult));

      const result = await ruleEngine.validateRulePack('valid-rulepack.yaml');

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(validationResult);
      expect(mockRepository.validateRulePack).toHaveBeenCalledWith(
        'valid-rulepack.yaml'
      );
    });

    test('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      mockRepository.validateRulePack.mockResolvedValue(err(error));

      const result = await ruleEngine.validateRulePack('invalid-rulepack.yaml');

      expect(result.isErr()).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('applyRules', () => {
    test('should apply rules to single object successfully', async () => {
      const rules = [
        createRule({
          id: 'email-rule',
          matchRegex: ['\\b[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}\\b'],
          severity: 'high',
          category: 'pii',
        }),
        createRule({
          id: 'phone-rule',
          matchKeywords: ['phone', 'telephone'],
          severity: 'medium',
          category: 'pii',
        }),
      ];
      const rulePack = createRulePack({ rules });

      const objects = [
        {
          data: { email: 'test@example.com', contact: 'phone number' },
          fields: { email: 'test@example.com', contact: 'phone number' },
          metadata: { index: 0, source: 'test', type: 'json' },
        },
      ];

      const result = await ruleEngine.applyRules(objects, rulePack);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(2); // One violation per rule

      const violations = result.value;
      expect(violations[0].ruleId).toBe('email-rule');
      expect(violations[0].severity).toBe('high');
      expect(violations[1].ruleId).toBe('phone-rule');
      expect(violations[1].severity).toBe('medium');
    });

    test('should skip disabled rules', async () => {
      const rules = [
        createRule({
          id: 'enabled-rule',
          matchKeywords: ['test'],
          enabled: true,
        }),
        createRule({
          id: 'disabled-rule',
          matchKeywords: ['test'],
          enabled: false,
        }),
      ];
      const rulePack = createRulePack({ rules });

      const objects = [
        {
          data: 'test content',
          fields: { content: 'test content' },
          metadata: { index: 0, source: 'test', type: 'text' },
        },
      ];

      const result = await ruleEngine.applyRules(objects, rulePack);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].ruleId).toBe('enabled-rule');
    });

    test('should handle multiple objects', async () => {
      const rules = [
        createRule({ id: 'test-rule', matchKeywords: ['violation'] }),
      ];
      const rulePack = createRulePack({ rules });

      const objects = [
        {
          data: 'first violation',
          fields: { content: 'first violation' },
          metadata: { index: 0, source: 'test', type: 'text' },
        },
        {
          data: 'second violation',
          fields: { content: 'second violation' },
          metadata: { index: 1, source: 'test', type: 'text' },
        },
      ];

      const result = await ruleEngine.applyRules(objects, rulePack);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].objectIndex).toBe(0);
      expect(result.value[1].objectIndex).toBe(1);
    });

    test('should handle empty objects array', async () => {
      const rulePack = createRulePack();
      const result = await ruleEngine.applyRules([], rulePack);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });

    test('should handle rulepack with no enabled rules', async () => {
      const rules = [createRule({ enabled: false })];
      const rulePack = createRulePack({ rules });

      const objects = [
        {
          data: 'test content',
          fields: { content: 'test content' },
          metadata: { index: 0, source: 'test', type: 'text' },
        },
      ];

      const result = await ruleEngine.applyRules(objects, rulePack);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('testRule', () => {
    test('should test single rule against content', async () => {
      const rule = createRule({
        id: 'test-rule',
        matchKeywords: ['secret'],
        severity: 'critical',
        category: 'security',
      });

      const result = await ruleEngine.testRule(
        'This is a secret document',
        rule
      );

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].ruleId).toBe('test-rule');
      expect(result.value[0].severity).toBe('critical');
      expect(result.value[0].context.match).toBe('secret');
    });

    test('should return empty array when no matches', async () => {
      const rule = createRule({ matchKeywords: ['nonexistent'] });
      const result = await ruleEngine.testRule(
        'This content has no matches',
        rule
      );

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });

    test('should handle regex patterns', async () => {
      const rule = createRule({
        id: 'email-rule',
        matchRegex: ['\\b[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}\\b'],
        matchKeywords: [],
      });

      const result = await ruleEngine.testRule(
        'Contact us at support@example.com',
        rule
      );

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].context.match).toBe('support@example.com');
    });

    test('should handle case sensitivity', async () => {
      const caseSensitiveRule = createRule({
        matchKeywords: ['Secret'],
        caseSensitive: true,
      });
      const caseInsensitiveRule = createRule({
        matchKeywords: ['Secret'],
        caseSensitive: false,
      });

      const content = 'This is a secret document';

      const sensitiveResult = await ruleEngine.testRule(
        content,
        caseSensitiveRule
      );
      const insensitiveResult = await ruleEngine.testRule(
        content,
        caseInsensitiveRule
      );

      expect(sensitiveResult.value).toHaveLength(0);
      expect(insensitiveResult.value).toHaveLength(1);
    });

    test('should handle disabled rules', async () => {
      const disabledRule = createRule({
        matchKeywords: ['test'],
        enabled: false,
      });

      const result = await ruleEngine.testRule('test content', disabledRule);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('rule matching logic', () => {
    test('should find keyword matches with correct positions', async () => {
      const rule = createRule({ matchKeywords: ['password'] });
      const content = 'Your password is: password123';

      const result = await ruleEngine.testRule(content, rule);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(2); // Two occurrences of "password"

      const firstMatch = result.value[0];
      expect(firstMatch.position.start).toBe(5);
      expect(firstMatch.position.end).toBe(13);

      const secondMatch = result.value[1];
      expect(secondMatch.position.start).toBe(18);
      expect(secondMatch.position.end).toBe(26);
    });

    test('should find regex matches with correct positions', async () => {
      const rule = createRule({
        matchRegex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b'],
        matchKeywords: [],
      });
      const content = 'SSN: 123-45-6789 and another: 987-65-4321';

      const result = await ruleEngine.testRule(content, rule);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].context.match).toBe('123-45-6789');
      expect(result.value[1].context.match).toBe('987-65-4321');
    });

    test('should provide context around matches', async () => {
      const rule = createRule({ matchKeywords: ['secret'] });
      const content =
        'This is a very secret document with sensitive information';

      const result = await ruleEngine.testRule(content, rule);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(1);

      const violation = result.value[0];
      expect(violation.context.before).toBe('This is a very ');
      expect(violation.context.match).toBe('secret');
      expect(violation.context.after).toBe(
        ' document with sensitive information'
      );
    });

    test('should handle overlapping patterns', async () => {
      const rule = createRule({
        matchRegex: ['\\b\\w*test\\w*\\b'],
        matchKeywords: ['test'],
      });
      const content = 'testing the test function';

      const result = await ruleEngine.testRule(content, rule);

      expect(result.isOk()).toBe(true);
      // Should find matches from both regex and keyword patterns
      expect(result.value.length).toBeGreaterThan(1);
    });

    test('should handle malformed regex gracefully', async () => {
      const rule = createRule({
        matchRegex: ['[invalid regex'],
        matchKeywords: [],
      });

      const result = await ruleEngine.testRule('test content', rule);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Invalid regex pattern');
    });
  });

  describe('performance considerations', () => {
    test('should handle large content efficiently', async () => {
      const rule = createRule({ matchKeywords: ['test'] });
      const largeContent =
        'word '.repeat(10000) + 'test' + ' word'.repeat(10000);

      const startTime = Date.now();
      const result = await ruleEngine.testRule(largeContent, rule);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle many rules efficiently', async () => {
      const rules = Array.from({ length: 100 }, (_, i) =>
        createRule({ id: `rule-${i}`, matchKeywords: [`keyword${i}`] })
      );
      const rulePack = createRulePack({ rules });

      const objects = [
        {
          data: 'keyword50 content',
          fields: { content: 'keyword50 content' },
          metadata: { index: 0, source: 'test', type: 'text' },
        },
      ];

      const startTime = Date.now();
      const result = await ruleEngine.applyRules(objects, rulePack);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].ruleId).toBe('rule-50');
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('error handling', () => {
    test('should handle rule application exceptions', async () => {
      // Create a rule that will cause an error during processing
      const problematicRule = new Rule(
        'problematic',
        'Problematic rule',
        ['(?=.*' as any], // Invalid regex that will cause error
        [],
        'medium',
        'custom'
      );
      const rulePack = createRulePack({ rules: [problematicRule] });

      const objects = [
        {
          data: 'test content',
          fields: { content: 'test content' },
          metadata: { index: 0, source: 'test', type: 'text' },
        },
      ];

      const result = await ruleEngine.applyRules(objects, rulePack);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Rule application failed');
    });

    test('should handle null/undefined content gracefully', async () => {
      const rule = createRule({ matchKeywords: ['test'] });

      const result = await ruleEngine.testRule(null as any, rule);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });

    test('should handle empty string content', async () => {
      const rule = createRule({ matchKeywords: ['test'] });

      const result = await ruleEngine.testRule('', rule);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });
});
