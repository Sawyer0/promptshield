/**
 * Reporter Tests - Test output formatting and reporting functionality
 */

import { describe, test, expect } from '@jest/globals';
import Reporter from '../../src/utils/reporter';

describe('Reporter', () => {
  let reporter: Reporter;

  beforeEach(() => {
    reporter = new Reporter();
  });

  describe('Basic Functionality', () => {
    test('creates reporter instance', () => {
      expect(reporter).toBeInstanceOf(Reporter);
    });

    test('handles empty issues', () => {
      const emptyIssues: string[] = [];
      const output = reporter.generateReport(emptyIssues);
      
      expect(output).toContain('No issues found');
    });

    test('handles issues array', () => {
      const issues = ['Email address detected: test@example.com', 'Phone number detected: 555-123-4567'];
      const output = reporter.generateReport(issues);
      
      expect(output).toContain('Found 2 issue(s)');
    });
  });

  describe('Output Formats', () => {
    test('generates text output by default', () => {
      const issues = ['SSN detected: 123-45-6789'];
      const output = reporter.generateReport(issues);
      
      expect(output).toContain('Found 1 issue(s)');
    });

    test('generates JSON output', () => {
      const issues = ['Phone number detected: 555-123-4567'];
      const output = reporter.generateReport(issues, 'json');
      const parsed = JSON.parse(output);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toBe('Phone number detected: 555-123-4567');
    });

    test('handles multiple issues in JSON format', () => {
      const issues = [
        'Email detected: test@example.com',
        'Credit card detected: 4111-1111-1111-1111'
      ];
      const output = reporter.generateReport(issues, 'json');
      const parsed = JSON.parse(output);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toBe('Email detected: test@example.com');
      expect(parsed[1]).toBe('Credit card detected: 4111-1111-1111-1111');
    });
  });

  describe('Text Formatting', () => {
    test('formats single issue correctly', () => {
      const issues = ['Email address detected: test@example.com'];
      const output = reporter.formatTextReport(issues);
      
      expect(output).toContain('Found 1 issue(s)');
    });

    test('formats multiple issues correctly', () => {
      const issues = [
        'Email detected: test@example.com',
        'Phone detected: 555-123-4567',
        'SSN detected: 123-45-6789'
      ];
      const output = reporter.formatTextReport(issues);
      
      expect(output).toContain('Found 3 issue(s)');
    });

    test('handles empty issues array', () => {
      const issues: string[] = [];
      const output = reporter.formatTextReport(issues);
      
      expect(output).toContain('No issues found');
    });
  });

  describe('Constructor Options', () => {
    test('accepts options in constructor', () => {
      const options = { verbose: true, colorize: false };
      const reporterWithOptions = new Reporter(options);
      
      expect(reporterWithOptions).toBeInstanceOf(Reporter);
    });

    test('works with default options', () => {
      const reporterDefault = new Reporter();
      const issues = ['Test issue'];
      const output = reporterDefault.generateReport(issues);
      
      expect(output).toContain('Found 1 issue(s)');
    });
  });
});
