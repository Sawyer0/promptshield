/**
 * HTML utility functions for PromptShield
 * Provides HTML formatting and sanitization utilities
 */

/**
 * Escapes user content for safe HTML rendering
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats severity for HTML display with proper CSS classes
 * @param severity - The severity level
 * @returns Formatted severity string
 */
export function formatSeverityForHtml(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}

/**
 * Gets CSS class for severity styling
 * @param severity - The severity level
 * @returns CSS class name
 */
export function getSeverityCssClass(severity: string): string {
  return `severity-${severity.toLowerCase()}`;
}

/**
 * Creates context string for violation display
 * @param violation - The violation object
 * @returns Formatted context string
 */
export function createViolationContext(violation: {
  objectIndex?: number;
  field?: string;
  lineNumber?: number;
}): string {
  let contextStr = '';

  if (violation.objectIndex !== undefined && violation.field) {
    contextStr = ` [Object ${violation.objectIndex}, field: ${sanitizeHtml(violation.field)}]`;
  } else if (violation.field) {
    contextStr = ` [field: ${sanitizeHtml(violation.field)}]`;
  } else if (violation.lineNumber) {
    contextStr = ` [line: ${violation.lineNumber}]`;
  }

  return contextStr;
}

/**
 * Formats metadata for HTML display
 * @param metadata - The metadata object
 * @returns HTML string for metadata section
 */
export function formatMetadataForHtml(metadata: {
  scanDate: string;
  fileCount: number;
  totalViolations: number;
  rulepack?: string;
}): string {
  return `
        <div class="metadata">
            <div class="metadata-grid">
                <div class="metadata-item">
                    <strong>Scan Date:</strong><br>
                    ${metadata.scanDate}
                </div>
                <div class="metadata-item">
                    <strong>Files Scanned:</strong><br>
                    ${metadata.fileCount}
                </div>
                <div class="metadata-item">
                    <strong>Total Violations:</strong><br>
                    ${metadata.totalViolations}
                </div>
                ${
                  metadata.rulepack
                    ? `
                <div class="metadata-item">
                    <strong>RulePack:</strong><br>
                    ${metadata.rulepack}
                </div>`
                    : ''
                }
            </div>
        </div>`;
}

/**
 * Formats severity breakdown for HTML display
 * @param severityBreakdown - The severity breakdown object
 * @returns HTML string for severity breakdown
 */
export function formatSeverityBreakdownForHtml(
  severityBreakdown: Record<string, number>
): string {
  if (Object.keys(severityBreakdown).length === 0) {
    return '';
  }

  let severityHtml = '<h3>Severity Breakdown</h3>';
  for (const [severity, count] of Object.entries(severityBreakdown)) {
    severityHtml += `
            <div class="severity-item">
                <span class="severity-badge severity-${severity.toLowerCase()}">${severity.toUpperCase()}</span>
                <span>${count} violations</span>
            </div>`;
  }

  return severityHtml;
}

/**
 * Formats category breakdown for HTML display
 * @param categoryBreakdown - The category breakdown object
 * @returns HTML string for category breakdown
 */
export function formatCategoryBreakdownForHtml(
  categoryBreakdown: Record<string, number>
): string {
  if (Object.keys(categoryBreakdown).length === 0) {
    return '';
  }

  let categoryHtml = '<h3>Category Breakdown</h3>';
  for (const [category, count] of Object.entries(categoryBreakdown)) {
    categoryHtml += `
            <div class="severity-item">
                <span>${category}</span>
                <span>${count} violations</span>
            </div>`;
  }

  return categoryHtml;
}
