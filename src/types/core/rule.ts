export interface Rule {
  id: string;
  description: string;
  pattern: string;
  severity?: 'low' | 'medium' | 'high';
  category?: string;
  enabled?: boolean;
}

export interface Violation {
  ruleId: string;
  message: string;
  match: string;
  severity: string;
  category: string;
  filePath: string;
  objectIndex?: number; // For JSON arrays
  field?: string; // For JSON object fields (e.g., 'prompt', 'response')
  lineNumber?: number; // For text files
}

export interface ScanResult {
  file: string;
  violations: Violation[];
  durationMs: number;
}
