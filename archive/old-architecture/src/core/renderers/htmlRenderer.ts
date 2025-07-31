/**
 * HTML output renderer for PromptShield
 * Provides HTML output for web-based reports and dashboards
 */

import { ScanResult } from '../../types/core/rule';
import { OutputContext } from '../../types/core/outputFormat';
import { OutputRenderer } from './index';
import { sanitizeHtml } from '../../utils/html/htmlUtils';
import {
  formatMetadataForHtml,
  formatSeverityBreakdownForHtml,
  formatCategoryBreakdownForHtml,
  createViolationContext,
  getSeverityCssClass,
} from '../../utils/html/htmlUtils';

export class HtmlRenderer implements OutputRenderer {
  render(results: ScanResult[], context: OutputContext): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptShield Scan Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .metadata {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .metadata-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .metadata-item strong {
            color: #495057;
        }
        .summary {
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .summary-card h3 {
            margin-top: 0;
            color: #495057;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .severity-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f4;
        }
        .severity-item:last-child {
            border-bottom: none;
        }
        .severity-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .severity-critical { background: #dc3545; color: white; }
        .severity-high { background: #fd7e14; color: white; }
        .severity-medium { background: #ffc107; color: #212529; }
        .severity-low { background: #28a745; color: white; }
        .results {
            padding: 20px;
        }
        .file-section {
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        .file-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
            font-weight: bold;
            color: #495057;
        }
        .file-content {
            padding: 20px;
        }
        .violation {
            background: #fff5f5;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .violation.no-issues {
            background: #f0fff4;
            border-left-color: #28a745;
        }
        .violation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .rule-id {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .violation-details {
            margin-top: 10px;
            font-size: 0.9em;
            color: #6c757d;
        }
        .match-text {
            background: #fff3cd;
            padding: 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            margin-top: 8px;
            border-left: 3px solid #ffc107;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        @media (max-width: 768px) {
            .metadata-grid, .summary-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${this.renderHeader()}
        ${this.renderMetadata(context)}
        ${this.renderSummary(context)}
        ${this.renderResults(results)}
        ${this.renderFooter(context)}
    </div>
</body>
</html>`;

    return html;
  }

  private renderHeader(): string {
    return `
        <div class="header">
            <h1>PromptShield Scan Report</h1>
            <p>AI Compliance & Safety Analysis</p>
        </div>`;
  }

  private renderMetadata(context: OutputContext): string {
    return formatMetadataForHtml(context.metadata);
  }

  private renderSummary(context: OutputContext): string {
    if (context.metadata.totalViolations === 0) {
      return `
        <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>No Violations Found</h3>
                    <p>All scanned content passed the compliance checks.</p>
                </div>
            </div>
        </div>`;
    }

    const severityHtml = formatSeverityBreakdownForHtml(
      context.metadata.severityBreakdown
    );
    const categoryHtml = formatCategoryBreakdownForHtml(
      context.metadata.categoryBreakdown
    );

    return `
        <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    ${severityHtml}
                </div>
                <div class="summary-card">
                    ${categoryHtml}
                </div>
            </div>
        </div>`;
  }

  private renderResults(results: ScanResult[]): string {
    if (results.length === 0) {
      return `
        <div class="results">
            <h2>Results</h2>
            <p>No files were processed.</p>
        </div>`;
    }

    let resultsHtml = '<div class="results"><h2>Results</h2>';

    for (const result of results) {
      resultsHtml += `
        <div class="file-section">
            <div class="file-header">File: ${sanitizeHtml(result.file)}</div>
            <div class="file-content">`;

      if (result.violations.length === 0) {
        resultsHtml += `
            <div class="violation no-issues">
                <div class="violation-header">
                    <span>No violations found</span>
                </div>
            </div>`;
      } else {
        for (const violation of result.violations) {
          const severityClass = getSeverityCssClass(violation.severity);
          const contextStr = createViolationContext(violation);
          const fileLocation = violation.lineNumber
            ? ` (${result.file}:${violation.lineNumber})`
            : '';

          resultsHtml += `
            <div class="violation">
                <div class="violation-header">
                    <span class="rule-id">${sanitizeHtml(violation.ruleId)}</span>
                    <span class="severity-badge ${severityClass}">${sanitizeHtml(violation.severity.toUpperCase())}</span>
                </div>
                <div><strong>${sanitizeHtml(violation.category)}:</strong> ${sanitizeHtml(violation.message)}</div>
                <div class="violation-details">
                    <strong>Match:</strong> ${contextStr}${fileLocation}
                </div>
                <div class="match-text">${sanitizeHtml(violation.match)}</div>
            </div>`;
        }
      }

      resultsHtml += `
            </div>
        </div>`;
    }

    resultsHtml += '</div>';
    return resultsHtml;
  }

  private renderFooter(context: OutputContext): string {
    let optionsHtml = '';
    if (context.metadata.options) {
      const options = context.metadata.options;
      if (options.maxViolations || options.offset || options.limit) {
        const opts = [];
        if (options.maxViolations)
          opts.push(`Max violations: ${options.maxViolations}`);
        if (options.offset) opts.push(`Offset: ${options.offset}`);
        if (options.limit) opts.push(`Limit: ${options.limit}`);
        optionsHtml = `<p><strong>Options:</strong> ${opts.join(', ')}</p>`;
      }
    }

    return `
        <div class="footer">
            <p>Generated by PromptShield on ${context.metadata.scanDate}</p>
            ${optionsHtml}
        </div>`;
  }

  getExtension(): string {
    return '.html';
  }

  getMimeType(): string {
    return 'text/html';
  }

  supportsStreaming(): boolean {
    return false; // HTML needs complete structure
  }
}
