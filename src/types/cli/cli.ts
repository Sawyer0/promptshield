/**
 * CLI-specific type definitions for PromptShield
 */

import { Severity } from '../core/severity';
import { OutputFormat } from '../core/outputFormat';

/**
 * Represents CLI command options
 */
export interface CliOptions {
  debug?: boolean;
  failOn?: Severity;
  rulepack?: string;
  output?: OutputFormat;
  outputFile?: string;
  fields?: string;
  scanEntireObject?: boolean;
  maxObjects?: string;
  ndjson?: boolean;
  schema?: string;
  compress?: string;
  compressionLevel?: string;
}

/**
 * Represents CLI scan options
 */
export interface CliScanOptions extends CliOptions {
  input: string;
}

/**
 * Represents CLI command result
 */
export interface CliCommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: Error;
}

/**
 * Represents CLI help information
 */
export interface CliHelpInfo {
  name: string;
  description: string;
  version: string;
  commands: CliCommandInfo[];
  options: CliOptionInfo[];
}

/**
 * Represents CLI command information
 */
export interface CliCommandInfo {
  name: string;
  description: string;
  options: CliOptionInfo[];
  examples: string[];
}

/**
 * Represents CLI option information
 */
export interface CliOptionInfo {
  name: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  required: boolean;
  default?: string | boolean | number;
  choices?: string[];
}

/**
 * Represents CLI error information
 */
export interface CliErrorInfo {
  code: string;
  message: string;
  suggestion?: string;
  exitCode: number;
}

/**
 * Represents CLI validation result
 */
export interface CliValidationResult {
  isValid: boolean;
  errors: CliErrorInfo[];
  warnings: CliErrorInfo[];
}

/**
 * Represents CLI progress information
 */
export interface CliProgressInfo {
  current: number;
  total: number;
  percentage: number;
  message: string;
  stage: 'parsing' | 'scanning' | 'validating' | 'reporting';
}

/**
 * Represents CLI output formatting options
 */
export interface CliOutputOptions {
  format: OutputFormat;
  colorize?: boolean;
  verbose?: boolean;
  showProgress?: boolean;
  showSummary?: boolean;
}

/**
 * Represents CLI configuration
 */
export interface CliConfig {
  defaultRulepack?: string;
  defaultOutputFormat?: OutputFormat;
  defaultSeverity?: Severity;
  enableColors?: boolean;
  enableProgress?: boolean;
  maxFileSize?: number;
  timeout?: number;
}

/**
 * Type guard to check if a value is a CLI command result
 */
export function isCliCommandResult(value: unknown): value is CliCommandResult {
  if (!isJsonObject(value)) return false;

  const result = value as unknown as CliCommandResult;
  return (
    typeof result.success === 'boolean' &&
    typeof result.exitCode === 'number' &&
    typeof result.stdout === 'string' &&
    typeof result.stderr === 'string'
  );
}

/**
 * Type guard to check if a value is a CLI error info
 */
export function isCliErrorInfo(value: unknown): value is CliErrorInfo {
  if (!isJsonObject(value)) return false;

  const error = value as unknown as CliErrorInfo;
  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.exitCode === 'number'
  );
}

/**
 * Type guard to check if a value is a CLI progress info
 */
export function isCliProgressInfo(value: unknown): value is CliProgressInfo {
  if (!isJsonObject(value)) return false;

  const progress = value as unknown as CliProgressInfo;
  return (
    typeof progress.current === 'number' &&
    typeof progress.total === 'number' &&
    typeof progress.percentage === 'number' &&
    typeof progress.message === 'string' &&
    typeof progress.stage === 'string'
  );
}

/**
 * Type guard to check if a value is a JSON object
 */
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
