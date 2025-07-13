/**
 * CLI option validation for PromptShield
 */

import fs from 'fs';
import { Severity } from '../../types/core/severity';
import { OutputFormat } from '../../types/core/outputFormat';

export interface ScanOptions {
  debug?: boolean;
  failOn?: string;
  rulepack?: string;
  output?: OutputFormat;
  outputFile?: string;
  fields?: string; // Comma-separated list of fields to scan
  scanEntireObject?: boolean;
  maxObjects?: string; // CLI receives this as string, we parse it
  ndjson?: boolean; // Force NDJSON mode regardless of file extension
  schema?: string; // JSON schema to validate against
  compress?: string; // Compression type (gzip or deflate)
  compressionLevel?: string; // Compression level (0-9)
}

/**
 * Validates file format based on extension or --ndjson flag
 */
export function validateFileFormat(input: string, ndjson?: boolean): boolean {
  const isNdjsonMode = ndjson || !!input.match(/\.(ndjson|jsonl)$/);
  return !!input.match(/\.(json|ndjson|jsonl)$/) || isNdjsonMode;
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
