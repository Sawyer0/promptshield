import { applyRulesToText } from '../../src/domains/rules/core/services/RuleEngineImpl';

describe('Rule Matching Logic', () => {
  const testRules = [
    {
      id: 'keyword-test',
      description: 'Test keyword matching',
      match_keywords: ['test'],
      severity: 'medium' as const,
      enabled: true,
    },
    {
      id: 'regex-test',
      description: 'Test regex matching',
      match_regex: ['\\b\\w+\\b'],
      severity: 'high' as const,
      enabled: true,
    },
    {
      id: 'disabled-test',
      description: 'Test disabled rule',
      match_keywords: ['disabled'],
      severity: 'low' as const,
      enabled: false,
    },
  ];

  test('matches keywords', () => {
    const text = 'This is a test message';
    const violations = applyRulesToText(text, testRules, 'test.txt');

    const keywordViolations = violations.filter(
      (v) => v.ruleId === 'keyword-test'
    );
    expect(keywordViolations).toHaveLength(1);
    expect(keywordViolations[0].match).toBe('test');
  });

  test('matches regex patterns', () => {
    const text = 'This contains words';
    const violations = applyRulesToText(text, testRules, 'test.txt');

    const regexViolations = violations.filter((v) => v.ruleId === 'regex-test');
    expect(regexViolations.length).toBeGreaterThan(0);
  });

  test('skips disabled rules', () => {
    const text = 'This should not match anything';
    const violations = applyRulesToText(text, testRules, 'test.txt');

    const disabledViolations = violations.filter(
      (v) => v.ruleId === 'disabled-test'
    );
    expect(disabledViolations).toHaveLength(0);
  });

  test('handles invalid regex gracefully', () => {
    const invalidRules = [
      {
        id: 'invalid-regex',
        description: 'Test invalid regex',
        match_regex: ['[invalid-regex'],
        severity: 'medium' as const,
        enabled: true,
      },
    ];

    const text = 'This should not crash';
    const violations = applyRulesToText(text, invalidRules, 'test.txt');

    // Should not crash and should return no violations for invalid regex
    expect(violations).toHaveLength(0);
  });

  test('supports case sensitivity', () => {
    const caseSensitiveRules = [
      {
        id: 'case-sensitive',
        description: 'Case sensitive keyword',
        match_keywords: ['Test'],
        case_sensitive: true,
        severity: 'medium' as const,
        enabled: true,
      },
    ];

    const text = 'This is a test with Test and TEST';
    const violations = applyRulesToText(text, caseSensitiveRules, 'test.txt');

    // Should only match 'Test', not 'test' or 'TEST'
    expect(violations).toHaveLength(1);
    expect(violations[0].match).toBe('Test');
  });

  test('handles multiple rules on same text', () => {
    const text = 'This is a test with multiple matches';
    const violations = applyRulesToText(text, testRules, 'test.txt');

    // Should find violations from both keyword and regex rules
    expect(violations.length).toBeGreaterThan(1);
  });
});







