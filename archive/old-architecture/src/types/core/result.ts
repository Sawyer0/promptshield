/**
 * Core result types for scanning operations
 */

export interface ScanResult {
  file: string;
  violations: Violation[];
  durationMs: number;
}

export interface Violation {
  ruleId: string;
  message: string;
  match: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  filePath?: string;
  objectIndex?: number;
  field?: string;
  lineNumber?: number;
  context?: string;
}
