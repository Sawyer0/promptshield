/**
 * Configuration types for scanning operations
 */

import { JsonObject } from '../data/json';

/**
 * Compression type options
 */
export type CompressionType = 'gzip' | 'deflate';

/**
 * Compression configuration
 */
export interface CompressionConfig {
  type: CompressionType;
  level: number; // 1-9 for gzip, 1-9 for deflate
}

/**
 * Scan configuration options
 */
export interface ScanConfig {
  /**
   * Fields to scan in JSON objects (default: ['prompt', 'response'])
   */
  fieldsToScan?: string[];

  /**
   * Whether to scan the entire object as a string (fallback)
   */
  scanEntireObject?: boolean;

  /**
   * Debug mode for detailed logging
   */
  debug?: boolean;

  /**
   * Maximum number of objects to process (for large files)
   */
  maxObjects?: number;

  /**
   * Force NDJSON mode (treat input as newline-delimited JSON)
   */
  ndjsonMode?: boolean;

  /**
   * JSON schema to validate against
   */
  schemaName?: string;

  /**
   * Compression options for output
   */
  compression?: CompressionConfig;

  /**
   * Maximum depth for nested object traversal (default: 4)
   */
  maxDepth?: number;

  /**
   * Memory usage threshold for warnings (0.0-1.0, default: 0.8)
   */
  memoryWarningThreshold?: number;

  /**
   * Streaming threshold for large arrays (default: 1000)
   */
  streamingThreshold?: number;

  /**
   * Enable parallel processing for batch scans
   */
  parallel?: boolean;

  /**
   * Number of workers for parallel processing (default: CPU cores)
   */
  workers?: number;

  /**
   * Batch size for parallel processing (default: 10)
   */
  batchSize?: number;
}

/**
 * Default scan configuration
 */
export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  fieldsToScan: ['prompt', 'response'],
  scanEntireObject: false,
  debug: false,
  maxObjects: Infinity,
  ndjsonMode: false,
  schemaName: undefined,
  compression: undefined,
  maxDepth: 4,
  memoryWarningThreshold: 0.8,
  streamingThreshold: 1000,
  parallel: false,
  workers: undefined,
  batchSize: 10,
};

/**
 * Merges user config with defaults
 */
export function mergeScanConfig(userConfig: ScanConfig = {}): ScanConfig {
  return {
    ...DEFAULT_SCAN_CONFIG,
    ...userConfig,
  };
}

export interface JsonScanContext {
  objectIndex: number;
  field: string;
  value: string;
  object: JsonObject;
}
