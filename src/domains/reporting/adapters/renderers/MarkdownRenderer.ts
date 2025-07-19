import { Renderer } from '../../core/ports/Renderer';
import { Report } from '../../core/entities/Report';
import { Result, ok, err } from '../../../../shared/types/Result';
import { ViolationUtils } from '../../../../shared/types/Violation';
import { ScanMetricsUtils } from '../../../../shared/types/ScanMetrics';

/**
 * Markdown format renderer
 */
export class MarkdownRenderer implements Renderer {
  /**
   * Renders a report to Markdown format
   */
  async render(report: Report): Promise<Result<string, Error>> {
    try {
      const violations = report.getFilteredViolations();
      const summary = ViolationUtils.createSummary(violations);
      const metrics = report.scanResult.metrics;

      let output = '';

      // Header
      output += '# PromptShield Scan Report\n\n';

      // Summary
      output += '## Summary\n\n';
      output += `**Total Violations:** ${summary.total}\n\n`;

      if (summary.total > 0) {
        // Severity breakdown
        output += '### By Severity\n\n';
        for (const [severity, count] of Object.entries(summary.bySeverity)) {
          const emoji = this.getSeverityEmoji(severity);
          output += `${emoji} **${severity}:** ${count}\n`;
        }
        output += '\n';

        // Category breakdown
        if (Object.keys(summary.byCategory).length > 0) {
          output += '### By Category\n\n';
          for (const [category, count] of Object.entries(summary.byCategory)) {
            output += `- **${category}:** ${count}\n`;
          }
          output += '\n';
        }
      }

      // Metrics
      if (report.shouldIncludeMetrics()) {
        output += '## Metrics\n\n';
        output += `- **Objects Scanned:** ${metrics.objectsScanned}\n`;
        output += `- **Processing Time:** ${ScanMetricsUtils.formatProcessingTime(metrics.processingTime)}\n`;
        output += `- **Memory Usage:** ${ScanMetricsUtils.formatMemoryUsage(metrics.memoryUsage)}\n`;
        output += `- **Rules Applied:** ${metrics.rulesApplied}\n`;
        output += `- **Processing Rate:** ${ScanMetricsUtils.calculateProcessingRate(metrics).toFixed(2)} objects/sec\n`;
        if (metrics.streamingUsed) {
          output += `- **Streaming:** Used\n`;
        }
        output += '\n';
      }

      // Violations
      if (violations.length > 0) {
        output += '## Violations\n\n';

        for (const violation of violations) {
          const emoji = this.getSeverityEmoji(violation.severity);
          output += `### ${emoji} ${violation.ruleId}\n\n`;
          output += `**Description:** ${violation.ruleDescription}\n\n`;
          output += `**Severity:** ${violation.severity}\n\n`;
          output += `**Category:** ${violation.category}\n\n`;
          output += `**Message:** ${violation.message}\n\n`;

          if (violation.field) {
            output += `**Field:** ${violation.field}\n\n`;
          }

          if (violation.context) {
            output += `**Context:**\n\`\`\`\n${violation.context.match}\n\`\`\`\n\n`;
          }

          if (violation.position) {
            output += `**Position:** ${violation.position.start}-${violation.position.end}\n\n`;
          }

          output += '---\n\n';
        }
      } else {
        output += '## No Violations Found\n\n';
        output +=
          '✅ No safety violations detected in the scanned content.\n\n';
      }

      // Footer
      output += `*Generated at ${new Date().toISOString()} by PromptShield v1.0.0*\n`;

      return ok(output);
    } catch (error) {
      return err(new Error(`Failed to render Markdown report: ${error}`));
    }
  }

  /**
   * Gets the output format this renderer handles
   */
  getFormat(): string {
    return 'markdown';
  }

  /**
   * Checks if this renderer supports streaming
   */
  supportsStreaming(): boolean {
    return false;
  }

  /**
   * Gets emoji for severity level
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }
}
