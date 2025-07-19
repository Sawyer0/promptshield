/**
 * Type definitions for YAML data structures
 */

/**
 * Raw rule data as it appears in YAML files
 */
export interface RuleYamlData {
  id: string;
  description: string;
  match_regex?: string[];
  match_keywords?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  enabled: boolean;
  case_sensitive?: boolean;
}

/**
 * Raw rulepack data as it appears in YAML files
 */
export interface RulePackYamlData {
  version: string;
  last_updated: string;
  name: string;
  description: string;
  rules: RuleYamlData[];
  author?: string;
}

/**
 * Configuration data structure for scan settings
 */
export interface ScanConfigData {
  parallel?: boolean;
  batchSize?: number;
  timeout?: number;
  maxObjects?: number;
  maxDepth?: number;
  streamingThreshold?: number;
  memoryWarningThreshold?: number;
}

/**
 * Configuration data structure for output settings
 */
export interface OutputConfigData {
  format?: 'json' | 'markdown' | 'csv' | 'table' | 'html' | 'ndjson';
  file?: string;
  compress?: 'gzip' | 'deflate';
  compressionLevel?: number;
  fields?: string[];
}

/**
 * Generic configuration data
 */
export interface ConfigData {
  scan?: ScanConfigData;
  output?: OutputConfigData;
  [key: string]: unknown;
}
