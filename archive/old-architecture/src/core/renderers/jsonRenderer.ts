/**
 * JSON output renderer for PromptShield
 * Provides structured JSON output with metadata and statistics
 */

import { ScanResult } from '../../types/core/rule';
import { OutputContext } from '../../types/core/outputFormat';
import { OutputRenderer } from './index';

export class JsonRenderer implements OutputRenderer {
  render(results: ScanResult[], context: OutputContext): string {
    const output = {
      metadata: context.metadata,
      results: results.map((result) => ({
        file: result.file,
        violations: result.violations.map((violation) => ({
          ruleId: violation.ruleId,
          severity: violation.severity,
          category: violation.category,
          message: violation.message,
          match: violation.match,
          objectIndex: violation.objectIndex,
          field: violation.field,
          lineNumber: violation.lineNumber,
        })),
      })),
      summary: {
        totalFiles: results.length,
        totalViolations: context.metadata.totalViolations,
        severityBreakdown: context.metadata.severityBreakdown,
        categoryBreakdown: context.metadata.categoryBreakdown,
      },
    };

    return JSON.stringify(output, null, 2);
  }

  getExtension(): string {
    return '.json';
  }

  getMimeType(): string {
    return 'application/json';
  }

  supportsStreaming(): boolean {
    return false; // JSON needs complete data for proper structure
  }
}
