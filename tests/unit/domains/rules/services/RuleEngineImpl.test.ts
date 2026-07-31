import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DefaultRuleEngine } from '../../../../../src/domains/rules/core/services/RuleEngineImpl';
import { RuleRepository, RuleMatcher } from '../../../../../src/domains/rules/core/ports/RuleEngine';
import { ok, err } from '../../../../../src/shared/types/Result';
import { createRule, createRulePack } from '../../../../helpers/testFactories';

describe('DefaultRuleEngine', () => {
  let engine: DefaultRuleEngine;
  let mockRepository: jest.Mocked<RuleRepository>;
  let mockMatcher: jest.Mocked<RuleMatcher>;

  beforeEach(() => {
    mockRepository = {
      loadFromYaml: (jest.fn() as any),
      saveToYaml: (jest.fn() as any),
    };
    mockMatcher = {
      match: (jest.fn() as any),
    };
    engine = new DefaultRuleEngine(mockRepository, mockMatcher);
  });

  describe('loadRulePack', () => {
    test('should load rulepack from repository', async () => {
      const rulePack = createRulePack();
      mockRepository.loadFromYaml.mockResolvedValue(ok(rulePack));

      const result = await engine.loadRulePack('path/to/rulepack.yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(rulePack);
      }
    });

    test('should return error if path is empty', async () => {
      const result = await engine.loadRulePack('');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('applyRules', () => {
    test('should apply rules and return violations', async () => {
      const rules = [createRule()];
      const fields = { content: 'test content' };
      const mockMatch = {
        matched: true,
        position: { start: 0, end: 4, line: 1, column: 1 },
        context: { before: '', match: 'test', after: ' content' },
        pattern: 'test'
      };

      mockMatcher.match.mockReturnValue([mockMatch]);

      const result = await engine.applyRules(fields, rules);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].ruleId).toBe(rules[0].id);
      }
    });
  });
});
