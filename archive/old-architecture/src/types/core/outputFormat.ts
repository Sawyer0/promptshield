export type OutputFormat =
  | 'json'
  | 'markdown'
  | 'csv'
  | 'table'
  | 'html'
  | 'ndjson'
  | 'console';

export interface OutputMetadata {
  scanDate: string;
  fileCount: number;
  totalViolations: number;
  severityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  rulepack?: string;
  filters?: {
    severity?: string[];
    category?: string[];
  };
  options?: {
    maxViolations?: number;
    offset?: number;
    limit?: number;
  };
}

export interface OutputContext {
  metadata: OutputMetadata;
  options: {
    noColor?: boolean;
    verbose?: boolean;
    quiet?: boolean;
  };
}
