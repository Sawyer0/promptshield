/**
 * Configuration for scan operations
 */
export interface ScanConfig {
  // Core options
  rulepack: string;
  outputFormat: OutputFormat;
  outputFile?: string;

  // Filtering options
  severity: string[];
  category: string[];
  maxViolations?: number;
  offset?: number;
  limit?: number;

  // Processing options
  fields: string[];
  scanEntireObject: boolean;
  maxObjects?: number;
  maxDepth: number;
  schema?: string;

  // Performance options
  ndjsonMode: boolean;
  streamingThreshold: number;
  parallel: boolean | number;
  batchSize: number;
  timeout: number;
  memoryWarningThreshold: number;

  // Compression options
  compress?: 'gzip' | 'deflate';
  compressionLevel?: number;

  // Output control
  quiet: boolean;
  verbose: boolean;
  debug: boolean;
  noColor?: boolean;
  strict: boolean;
  failOn?: string;
}

export type OutputFormat =
  | 'json'
  | 'markdown'
  | 'csv'
  | 'table'
  | 'html'
  | 'ndjson';

export const defaultScanConfig: ScanConfig = {
  rulepack: '',
  outputFormat: 'markdown',
  severity: ['low', 'medium', 'high', 'critical'],
  category: [],
  fields: ['prompt', 'response'],
  scanEntireObject: false,
  maxDepth: 4,
  ndjsonMode: false,
  streamingThreshold: 1000,
  parallel: false,
  batchSize: 10,
  timeout: 300,
  memoryWarningThreshold: 0.8,
  quiet: false,
  verbose: false,
  debug: false,
  strict: false,
};
