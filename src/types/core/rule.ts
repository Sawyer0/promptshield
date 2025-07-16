import { Severity, Category } from './severity';

export interface Rule {
  id: string;
  description: string;
  match_regex?: string[];
  match_keywords?: string[];
  severity?: Severity | string;
  category?: Category | string;
  enabled?: boolean;
  case_sensitive?: boolean;
}

export interface Violation {
  ruleId: string;
  message: string;
  match: string;
  severity: Severity;
  category: Category;
  filePath: string;
  objectIndex?: number; // For JSON arrays
  field?: string; // For JSON object fields (e.g., 'prompt', 'response')
  lineNumber?: number; // For text files
}

/**
 * Helper to create a Violation object with all fields present (undefined if not provided)
 */
export function createViolation(params: {
  ruleId: string;
  message: string;
  match: string;
  severity: Severity;
  category: Category;
  filePath: string;
  objectIndex?: number;
  field?: string;
  lineNumber?: number;
}): Violation {
  return {
    ruleId: params.ruleId,
    message: params.message,
    match: params.match,
    severity: params.severity,
    category: params.category,
    filePath: params.filePath,
    objectIndex: params.objectIndex ?? undefined,
    field: params.field ?? undefined,
    lineNumber: params.lineNumber ?? undefined,
  };
}

export interface ScanResult {
  file: string;
  violations: Violation[];
  durationMs: number;
}
