/**
 * Type definitions for YAML data structures
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

export interface RulePackYamlData {
  version: string;
  last_updated: string;
  name: string;
  description: string;
  rules: RuleYamlData[];
  author?: string;
}

export interface ScanConfigData {
  parallel?: boolean;
  batchSize?: number;
  timeout?: number;
  maxObjects?: number;
  maxDepth?: number;
  streamingThreshold?: number;
  memoryWarningThreshold?: number;
}

export interface OutputConfigData {
  format?: 'json' | 'markdown' | 'csv' | 'table' | 'html' | 'ndjson';
  file?: string;
  compress?: 'gzip' | 'deflate';
  compressionLevel?: number;
  fields?: string[];
}

export interface ConfigData {
  scan?: ScanConfigData;
  output?: OutputConfigData;
  [key: string]: unknown;
}
