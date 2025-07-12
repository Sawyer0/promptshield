import { describe, test, expect } from '@jest/globals';
import RuleEngine from '../src/rules';

describe('Rules', () => {
  test('placeholder', () => {
    expect(true).toBe(true);
  });

  test('creates rule engine instance', () => {
    const ruleEngine = new RuleEngine();
    expect(ruleEngine).toBeInstanceOf(RuleEngine);
  });
});
