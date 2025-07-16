/**
 * Shared option parsing utilities for scan command
 * Provides consistent option parsing and configuration building
 */

import * as os from 'os';
import { ScanOptions } from '../../validators/options';
import { ScanConfig } from '../../../types/core/scanConfig';
import { OutputFormat } from '../../../types/core/outputFormat';
import { OutputOptions } from '../../output/outputHandler';
import { parseCommaSeparated } from '../../validators/options';

/**
 * Parses scan configuration from CLI options
 * @param options - The CLI options
 * @param input - The input file path
 * @returns Parsed scan configuration
 */
export function parseScanConfig(
  options: ScanOptions,
  input: string
): ScanConfig {
  const isNdjsonMode = options.ndjson || !!input.match(/\.(ndjson|jsonl)$/);

  return {
    fieldsToScan: options.fields
      ? options.fields.split(',').map((f) => f.trim())
      : undefined,
    scanEntireObject: options.scanEntireObject,
    debug: options.debug,
    maxObjects: options.maxObjects
      ? parseInt(options.maxObjects, 10)
      : undefined,
    ndjsonMode: isNdjsonMode,
    schemaName: options.schema,
    compression: options.compress
      ? {
          type: options.compress as 'gzip' | 'deflate',
          level: options.compressionLevel
            ? parseInt(options.compressionLevel, 10)
            : 6,
        }
      : undefined,
    maxDepth: options.maxDepth ? parseInt(options.maxDepth, 10) : 4,
    streamingThreshold: options.streamingThreshold
      ? parseInt(options.streamingThreshold, 10)
      : undefined,
    memoryWarningThreshold: options.memoryWarningThreshold
      ? parseFloat(options.memoryWarningThreshold)
      : undefined,
    parallel: parseParallelOption(options.parallel),
    workers: parseWorkersOption(options.parallel),
    batchSize: options.batchSize ? parseInt(options.batchSize, 10) : undefined,
  };
}

/**
 * Parses output options from CLI options
 * @param options - The CLI options
 * @returns Parsed output options
 */
export function parseOutputOptions(options: ScanOptions): OutputOptions {
  return {
    format: (options.output as OutputFormat) || 'markdown',
    outputFile: options.outputFile,
    compress: options.compress as 'gzip' | 'deflate',
    compressionLevel: options.compressionLevel
      ? parseInt(options.compressionLevel, 10)
      : 6,
    noColor: options.noColor,
    quiet: options.quiet,
    verbose: options.verbose,
  };
}

/**
 * Parses filter options from CLI options
 * @param options - The CLI options
 * @returns Parsed filter options
 */
export function parseFilterOptions(options: ScanOptions): {
  severityFilter?: string[];
  categoryFilter?: string[];
} {
  return {
    severityFilter: options.severity
      ? parseCommaSeparated(options.severity)
      : undefined,
    categoryFilter: options.category
      ? parseCommaSeparated(options.category)
      : undefined,
  };
}

/**
 * Parses pagination options from CLI options
 * @param options - The CLI options
 * @returns Parsed pagination options
 */
export function parsePaginationOptions(options: ScanOptions): {
  offset?: number;
  limit?: number;
} {
  return {
    offset: options.offset ? parseInt(options.offset, 10) : undefined,
    limit: options.limit ? parseInt(options.limit, 10) : undefined,
  };
}

/**
 * Gets the default RulePack path
 * @param options - The CLI options
 * @returns The RulePack path
 */
export function getRulePackPath(options: ScanOptions): string {
  return options.rulepack || 'rulepacks/pii.yaml';
}

/**
 * Parses parallel option from CLI options
 * @param parallel - The parallel option value
 * @returns Whether parallel processing is enabled
 */
function parseParallelOption(parallel?: string | boolean): boolean {
  if (parallel === undefined) return false;
  if (typeof parallel === 'boolean') return parallel;
  return true; // If string value provided, enable parallel processing
}

/**
 * Parses workers option from parallel CLI option
 * @param parallel - The parallel option value
 * @returns Number of workers to use
 */
function parseWorkersOption(parallel?: string | boolean): number | undefined {
  if (parallel === undefined || parallel === false) return undefined;
  if (typeof parallel === 'boolean') return os.cpus().length;

  // If string value provided, try to parse as number
  const workers = parseInt(parallel, 10);
  if (isNaN(workers) || workers <= 0) {
    return os.cpus().length; // Default to CPU count if invalid
  }

  return Math.min(workers, os.cpus().length * 2); // Cap at 2x CPU count
}
