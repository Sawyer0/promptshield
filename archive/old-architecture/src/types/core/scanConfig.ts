/**
 * Core scan configuration types
 */

export interface ScanConfig {
  fieldsToScan?: string[];
  scanEntireObject?: boolean;
  debug?: boolean;
  maxObjects?: number;
  ndjsonMode?: boolean;
  schemaName?: string;
  maxDepth?: number;
  memoryWarningThreshold?: number;
  streamingThreshold?: number;
  parallel?: boolean;
  workers?: number;
  batchSize?: number;
}
