/**
 * CLI Option Parsing and Types
 * Minimal interface that delegates to core validation
 */

import { Validator, FileValidator, OptionValidator } from '../../validation';

// CLI option types
export interface ScanOptions {
  rulepack?: string;
  failSeverity?: string;
  output?: string;
  format?: string;
  quiet?: boolean;
  verbose?: boolean;
  ndjson?: boolean;
  [key: string]: any;
}

// Simple delegation to core validation
export const validateFileFormat = (input: string, ndjson?: boolean) =>
  FileValidator.validateDataFile(input, ndjson).isValid;

export const validateRulepack = (path: string) => Validator.rulepack(path);

export const validateSeverity = (severity: string) =>
  OptionValidator.validateSeverity(severity).isValid;

export const validateOutputFormat = (format: string) =>
  OptionValidator.validateOutputFormat(format).isValid;

export const validateScanOptions = (options: ScanOptions) => {
  // Let the core validator handle everything
  try {
    Validator.scan('dummy', options); // We only validate options here
    return true;
  } catch {
    return false;
  }
};

// Utility functions
export const parseCommaSeparated = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
