/**
 * Type definitions for test command
 */

export interface TestOptions {
  rulepack?: string;
  rule?: string;
  file?: string;
  output?: string;
  verbose?: boolean;
  quiet?: boolean;
  category?: string;
  severity?: string;
  debug?: boolean;
}

export interface TestResult {
  input: string;
  matches: TestMatch[];
  rulepack: string;
  totalMatches: number;
  executionTime: number;
}

export interface TestMatch {
  ruleId: string;
  ruleName: string;
  severity: string;
  category: string;
  matches: string[];
  positions: MatchPosition[];
}

export interface MatchPosition {
  start: number;
  end: number;
  text: string;
}
