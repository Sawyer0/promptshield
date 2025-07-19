import { describe, test, expect } from '@jest/globals';
import { Rule } from '../../../../../src/domains/rules/core/entities/Rule';

describe('Rule', () => {
  describe('constructor', () => {
    test('should create rule with all parameters', () => {
      const rule = new Rule(
        'test-rule',
        'Test description',
        ['\\btest\\b'],
        ['keyword'],
        'high',
        'security',
        true,
        false
      );

      expect(rule.id).toBe('test-rule');
      expect(rule.description).toBe('Test description');
      expect(rule.matchRegex).toEqual(['\\btest\\b']);
      expect(rule.matchKeywords).toEqual(['keyword']);
      expect(rule.severity).toBe('high');
      expect(rule.category).toBe('security');
      expect(rule.enabled).toBe(true);
      expect(rule.caseSensitive).toBe(false);
    });

    test('should create rule with minimal parameters', () => {
      const rule = new Rule(
        'minimal-rule',
        'Minimal description',
        [],
        ['test'],
        'medium',
        'custom'
      );

      expect(rule.id).toBe('minimal-rule');
      expect(rule.description).toBe('Minimal description');
      expect(rule.matchRegex).toEqual([]);
      expect(rule.matchKeywords).toEqual(['test']);
      expect(rule.severity).toBe('medium');
      expect(rule.category).toBe('custom');
      expect(rule.enabled).toBe(true); // default
      expect(rule.caseSensitive).toBe(false); // default
    });
  });

  describe('hasRegexPatterns', () => {
    test('should return true when regex patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        ['\\btest\\b'],
        [],
        'medium',
        'custom'
      );
      expect(rule.hasRegexPatterns()).toBe(true);
    });

    test('should return false when no regex patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        [],
        ['keyword'],
        'medium',
        'custom'
      );
      expect(rule.hasRegexPatterns()).toBe(false);
    });

    test('should return false when regex array is empty', () => {
      const rule = new Rule('test', 'test', [], [], 'medium', 'custom');
      expect(rule.hasRegexPatterns()).toBe(false);
    });
  });

  describe('hasKeywordPatterns', () => {
    test('should return true when keyword patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        [],
        ['keyword'],
        'medium',
        'custom'
      );
      expect(rule.hasKeywordPatterns()).toBe(true);
    });

    test('should return false when no keyword patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        ['\\btest\\b'],
        [],
        'medium',
        'custom'
      );
      expect(rule.hasKeywordPatterns()).toBe(false);
    });

    test('should return false when keywords array is empty', () => {
      const rule = new Rule('test', 'test', [], [], 'medium', 'custom');
      expect(rule.hasKeywordPatterns()).toBe(false);
    });
  });

  describe('hasAnyPatterns', () => {
    test('should return true when regex patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        ['\\btest\\b'],
        [],
        'medium',
        'custom'
      );
      expect(rule.hasAnyPatterns()).toBe(true);
    });

    test('should return true when keyword patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        [],
        ['keyword'],
        'medium',
        'custom'
      );
      expect(rule.hasAnyPatterns()).toBe(true);
    });

    test('should return true when both patterns exist', () => {
      const rule = new Rule(
        'test',
        'test',
        ['\\btest\\b'],
        ['keyword'],
        'medium',
        'custom'
      );
      expect(rule.hasAnyPatterns()).toBe(true);
    });

    test('should return false when no patterns exist', () => {
      const rule = new Rule('test', 'test', [], [], 'medium', 'custom');
      expect(rule.hasAnyPatterns()).toBe(false);
    });
  });

  describe('clone', () => {
    test('should create exact copy of rule', () => {
      const original = new Rule(
        'original',
        'Original description',
        ['\\boriginal\\b'],
        ['original'],
        'critical',
        'security',
        false,
        true
      );

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.id).toBe(original.id);
      expect(cloned.description).toBe(original.description);
      expect(cloned.matchRegex).toEqual(original.matchRegex);
      expect(cloned.matchKeywords).toEqual(original.matchKeywords);
      expect(cloned.severity).toBe(original.severity);
      expect(cloned.category).toBe(original.category);
      expect(cloned.enabled).toBe(original.enabled);
      expect(cloned.caseSensitive).toBe(original.caseSensitive);
    });

    test('should create independent copy', () => {
      const original = new Rule(
        'test',
        'test',
        ['pattern'],
        ['keyword'],
        'medium',
        'custom'
      );
      const cloned = original.clone();

      // Modify arrays in original
      original.matchRegex.push('new-pattern');
      original.matchKeywords.push('new-keyword');

      // Cloned should be unaffected
      expect(cloned.matchRegex).not.toContain('new-pattern');
      expect(cloned.matchKeywords).not.toContain('new-keyword');
    });
  });

  describe('withOverrides', () => {
    test('should create rule with overridden properties', () => {
      const original = new Rule(
        'original',
        'Original',
        ['pattern'],
        ['keyword'],
        'medium',
        'custom'
      );

      const modified = original.withOverrides({
        description: 'Modified description',
        severity: 'critical',
        enabled: false,
      });

      expect(modified.id).toBe('original'); // unchanged
      expect(modified.description).toBe('Modified description'); // changed
      expect(modified.severity).toBe('critical'); // changed
      expect(modified.enabled).toBe(false); // changed
      expect(modified.category).toBe('custom'); // unchanged
    });

    test('should not modify original rule', () => {
      const original = new Rule(
        'test',
        'Original',
        [],
        ['test'],
        'medium',
        'custom'
      );

      original.withOverrides({
        description: 'Modified',
        severity: 'critical',
      });

      expect(original.description).toBe('Original');
      expect(original.severity).toBe('medium');
    });
  });

  describe('getSeverityLevel', () => {
    test('should return correct severity levels', () => {
      expect(
        new Rule(
          'test',
          'test',
          [],
          ['test'],
          'low',
          'custom'
        ).getSeverityLevel()
      ).toBe(1);
      expect(
        new Rule(
          'test',
          'test',
          [],
          ['test'],
          'medium',
          'custom'
        ).getSeverityLevel()
      ).toBe(2);
      expect(
        new Rule(
          'test',
          'test',
          [],
          ['test'],
          'high',
          'custom'
        ).getSeverityLevel()
      ).toBe(3);
      expect(
        new Rule(
          'test',
          'test',
          [],
          ['test'],
          'critical',
          'custom'
        ).getSeverityLevel()
      ).toBe(4);
    });
  });

  describe('validation', () => {
    test('should accept valid severities', () => {
      expect(
        () => new Rule('test', 'test', [], ['test'], 'low', 'custom')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'custom')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'high', 'custom')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'critical', 'custom')
      ).not.toThrow();
    });

    test('should accept valid categories', () => {
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'pii')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'bias')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'hallucination')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'security')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'compliance')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'parse')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'internal')
      ).not.toThrow();
      expect(
        () => new Rule('test', 'test', [], ['test'], 'medium', 'custom')
      ).not.toThrow();
    });
  });

  describe('toString', () => {
    test('should return readable string representation', () => {
      const rule = new Rule(
        'email-rule',
        'Email detection',
        ['\\b[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}\\b'],
        ['email'],
        'high',
        'pii'
      );
      const str = rule.toString();

      expect(str).toContain('email-rule');
      expect(str).toContain('Email detection');
      expect(str).toContain('high');
      expect(str).toContain('pii');
    });
  });
});
