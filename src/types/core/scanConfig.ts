/**
 * Configuration types for scanning operations
 */

import { JsonObject } from '../data/json';

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
  compression?: {
    type: 'gzip' | 'deflate';
    level: number;
  };
}

export interface JsonScanContext {
  objectIndex: number;
  field: string;
  value: string;
  object: JsonObject;
}
