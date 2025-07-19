import { Renderer } from '../../core/ports/Renderer';
import { Report } from '../../core/entities/Report';
import { Result, ok, err } from '../../../../shared/types/Result';
import { ViolationUtils } from '../../../../shared/types/Violation';
import { ScanMetricsUtils } from '../../../../shared/types/ScanMetrics';

/**
 * JSON format renderer
 */
export class JsonRenderer implements Renderer {
  /**
   * Renders a report to JSON format
   */
  async render(report: Report): Promise<Result<string, Error>> {
    try {
      const violations = report.getFilteredViolations();
      const summary = ViolationUtils.createSummary(violations);
      const metrics = report.scanResult.metrics;

      const output: {
        summary: {
          total_violations: number;
          by_severity: Record<string, number>;
          by_category: Record<string, number>;
        };
        violations: Array<{
          rule_id: string;
          rule_description: string;
          severity: string;
          category: string;
          message: string;
          field: string;
          object_index: number;
          position?: {
            start: number;
            end: number;
            line?: number;
            column?: number;
          };
          context: { before?: string; match: string; after?: string };
          metadata?: Record<string, unknown>;
        }>;
        metrics?: {
          objects_scanned: number;
          processing_time_ms: number;
          memory_usage_bytes: number;
          rules_applied: number;
          processing_rate: number;
          average_time_per_object_ms: number;
        };
        metadata?: {
          generated_at: string;
          version: string;
        };
      } = {
        summary: {
          total_violations: summary.total,
          by_severity: summary.bySeverity,
          by_category: summary.byCategory,
        },
        violations: violations.map((v) => ({
          rule_id: v.ruleId,
          rule_description: v.ruleDescription,
          severity: v.severity,
          category: v.category,
          message: v.message,
          field: v.field,
          object_index: v.objectIndex,
          position: v.position,
          context: v.context,
          metadata: v.metadata,
        })),
      };

      // Include metrics if requested
      if (report.shouldIncludeMetrics()) {
        output.metrics = {
          objects_scanned: metrics.objectsScanned,
          processing_time_ms: metrics.processingTime,
          memory_usage_bytes: metrics.memoryUsage,
          rules_applied: metrics.rulesApplied,
          processing_rate: ScanMetricsUtils.calculateProcessingRate(metrics),
          average_time_per_object_ms: metrics.averageTimePerObject ?? 0,
        };
      }

      // Include metadata
      output.metadata = {
        generated_at: new Date().toISOString(),
        version: '1.0.0',
      };

      const jsonString = report.options.verbose
        ? JSON.stringify(output, null, 2)
        : JSON.stringify(output);

      return ok(jsonString);
    } catch (error) {
      return err(new Error(`Failed to render JSON report: ${error}`));
    }
  }

  /**
   * Gets the output format this renderer handles
   */
  getFormat(): string {
    return 'json';
  }

  /**
   * Checks if this renderer supports streaming
   */
  supportsStreaming(): boolean {
    return false;
  }
}
