/**
 * CLI option validation for PromptShield
 */

import * as fs from 'fs';
import { Severity } from '../../types/core/severity';
import { Category } from '../../types/core/severity';
import { OutputFormat } from '../../types/core/outputFormat';

export interface ScanOptions {
  debug?: boolean;
  failOn?: string;
  rulepack?: string;
  output?: OutputFormat;
  outputFile?: string;
  severity?: string; // Comma-separated severity levels
  category?: string; // Comma-separated categories
  enabledOnly?: boolean; // Show only enabled rules
  maxViolations?: string; // Maximum violations to report
  offset?: string; // Pagination offset
  limit?: string; // Pagination limit
  quiet?: boolean; // Suppress progress output
  verbose?: boolean; // Enable verbose output
  suggest?: boolean; // Show remediation suggestions
  fields?: string; // Comma-separated list of fields to scan
  scanEntireObject?: boolean;
  maxObjects?: string; // CLI receives this as string, we parse it
  ndjson?: boolean; // Force NDJSON mode regardless of file extension
  schema?: string; // JSON schema to validate against
  compress?: string; // Compression type (gzip or deflate)
  compressionLevel?: string; // Compression level (0-9)
  noColor?: boolean; // Disable colored output
  strict?: boolean; // Enable strict mode
  timeout?: string; // Timeout in seconds
  maxDepth?: string; // Maximum depth for nested object traversal
  streamingThreshold?: string; // Threshold for streaming mode
  memoryWarningThreshold?: string; // Memory usage warning threshold
  parallel?: string | boolean; // Enable parallel scanning with optional worker count
  batchSize?: string; // Batch size for parallel processing
}

/**
 * Validates file format based on extension or --ndjson flag
 */
export function validateFileFormat(input: string, ndjson?: boolean): boolean {
  const isNdjsonMode = ndjson || !!input.match(/\.(ndjson|jsonl)$/);
  return !!input.match(/\.(json|ndjson|jsonl|txt)$/) || isNdjsonMode;
}

/**
 * Validates rulepack file exists
 */
export function validateRulepack(rulepackPath: string): boolean {
  return fs.existsSync(rulepackPath);
}

/**
 * Validates severity level
 */
export function validateSeverity(failSeverity: string): boolean {
  const severityLevels: Severity[] = ['low', 'medium', 'high', 'critical'];
  return severityLevels.includes(failSeverity as Severity);
}

/**
 * Validates severity filter (comma-separated list)
 */
export function validateSeverityFilter(severityFilter: string): boolean {
  const severities = severityFilter.split(',').map((s) => s.trim());
  const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];
  return severities.every((s) => validSeverities.includes(s as Severity));
}

/**
 * Validates category filter (comma-separated list)
 */
export function validateCategoryFilter(categoryFilter: string): boolean {
  const categories = categoryFilter.split(',').map((c) => c.trim());
  const validCategories: Category[] = [
    'pii',
    'bias',
    'hallucination',
    'security',
    'compliance',
    'parse',
    'internal',
    'custom',
  ];
  return categories.every((c) => validCategories.includes(c as Category));
}

/**
 * Validates output format
 */
export function validateOutputFormat(output: string): boolean {
  const validFormats: OutputFormat[] = [
    'json',
    'markdown',
    'csv',
    'table',
    'html',
    'ndjson',
  ];
  return validFormats.includes(output as OutputFormat);
}

/**
 * Validates numeric option with range (simple boolean version)
 * @deprecated Use validateNumericOption from cliValidators/optionValidators for better error handling
 */
export function validateNumericOption(
  value: string,
  min: number,
  max: number
): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validates timeout value
 */
export function validateTimeout(timeout: string): boolean {
  return validateNumericOption(timeout, 1, 3600); // 1 second to 1 hour
}

/**
 * Validates pagination parameters
 */
export function validatePagination(offset?: string, limit?: string): boolean {
  if (offset && !validateNumericOption(offset, 0, Number.MAX_SAFE_INTEGER)) {
    return false;
  }
  if (limit && !validateNumericOption(limit, 1, Number.MAX_SAFE_INTEGER)) {
    return false;
  }
  return true;
}

/**
 * Validates compression type
 */
export function validateCompressionType(compress?: string): boolean {
  if (!compress) return true;
  return ['gzip', 'deflate'].includes(compress);
}

/**
 * Validates compression level
 */
export function validateCompressionLevel(level?: string): boolean {
  if (!level) return true;
  const num = parseInt(level, 10);
  return !isNaN(num) && num >= 0 && num <= 9;
}

/**
 * Parses comma-separated string into array
 */
export function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Validates all scan options
 */
export function validateScanOptions(options: ScanOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate severity filter
  if (options.severity && !validateSeverityFilter(options.severity)) {
    errors.push(
      `Invalid severity filter: ${options.severity}. Use: low,medium,high,critical`
    );
  }

  // Validate category filter
  if (options.category && !validateCategoryFilter(options.category)) {
    errors.push(
      `Invalid category filter: ${options.category}. Use: pii,bias,hallucination,security,compliance,parse,internal,custom`
    );
  }

  // Validate output format
  if (options.output && !validateOutputFormat(options.output)) {
    errors.push(
      `Invalid output format: ${options.output}. Use: json,markdown,csv,table,html,ndjson`
    );
  }

  // Validate max violations
  if (
    options.maxViolations &&
    !validateNumericOption(options.maxViolations, 1, Number.MAX_SAFE_INTEGER)
  ) {
    errors.push(
      `Invalid max-violations: ${options.maxViolations}. Must be a positive number`
    );
  }

  // Validate pagination
  if (!validatePagination(options.offset, options.limit)) {
    errors.push(
      'Invalid pagination parameters. offset must be >= 0, limit must be >= 1'
    );
  }

  // Validate timeout
  if (options.timeout && !validateTimeout(options.timeout)) {
    errors.push(
      `Invalid timeout: ${options.timeout}. Must be between 1 and 3600 seconds`
    );
  }

  // Validate fail-on severity
  if (options.failOn && !validateSeverity(options.failOn)) {
    errors.push(
      `Invalid fail-on severity: ${options.failOn}. Use: low,medium,high,critical`
    );
  }

  // Validate compression
  if (options.compress && !validateCompressionType(options.compress)) {
    errors.push(
      `Invalid compression type: ${options.compress}. Use: gzip,deflate`
    );
  }

  if (
    options.compressionLevel &&
    !validateCompressionLevel(options.compressionLevel)
  ) {
    errors.push(
      `Invalid compression level: ${options.compressionLevel}. Must be between 0 and 9`
    );
  }

  // Validate maxDepth
  if (options.maxDepth && !validateNumericOption(options.maxDepth, 1, 20)) {
    errors.push(
      `Invalid max-depth: ${options.maxDepth}. Must be between 1 and 20`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
