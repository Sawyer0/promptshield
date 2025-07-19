/**
 * Markdown utility functions for PromptShield
 * Provides Markdown formatting and sanitization utilities
 */

/**
 * Escapes user content for safe Markdown rendering
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return '';
  return input
    .replace(/[`|*]/g, '\\$&') // Escape backticks, pipes, asterisks
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;');
}

/**
 * Gets severity indicator (no emoji for clean output)
 * @returns Empty string for clean output
 */
export function getSeverityEmoji(): string {
  // Return empty string for clean output like ESLint/Snyk
  return '';
}

/**
 * Creates context string for violation display in Markdown
 * @param violation - The violation object
 * @returns Formatted context string
 */
export function createViolationContext(violation: {
  objectIndex?: number;
  field?: string;
  lineNumber?: number;
}): string {
  let context = '';

  if (violation.objectIndex !== undefined && violation.field) {
    context = ` [Object ${violation.objectIndex}, field: ${sanitizeMarkdown(violation.field)}]`;
  } else if (violation.field) {
    context = ` [field: ${sanitizeMarkdown(violation.field)}]`;
  } else if (violation.lineNumber) {
    context = ` [line: ${violation.lineNumber}]`;
  }

  return context;
}

/**
 * Formats severity breakdown for Markdown display
 * @param severityBreakdown - The severity breakdown object
 * @returns Markdown string for severity breakdown
 */
export function formatSeverityBreakdownForMarkdown(
  severityBreakdown: Record<string, number>
): string {
  if (Object.keys(severityBreakdown).length === 0) {
    return '';
  }

  let summary = '### Severity Breakdown\n';
  for (const [severity, count] of Object.entries(severityBreakdown)) {
    summary += `- **${severity}:** ${count} violations\n`;
  }
  summary += '\n';

  return summary;
}

/**
 * Formats category breakdown for Markdown display
 * @param categoryBreakdown - The category breakdown object
 * @returns Markdown string for category breakdown
 */
export function formatCategoryBreakdownForMarkdown(
  categoryBreakdown: Record<string, number>
): string {
  if (Object.keys(categoryBreakdown).length === 0) {
    return '';
  }

  let summary = '### Category Breakdown\n';
  for (const [category, count] of Object.entries(categoryBreakdown)) {
    summary += `- **${category}:** ${count} violations\n`;
  }
  summary += '\n';

  return summary;
}

/**
 * Formats filters for Markdown display
 * @param filters - The filters object
 * @returns Markdown string for filters section
 */
export function formatFiltersForMarkdown(filters?: {
  severity?: string[];
  category?: string[];
}): string {
  if (!filters) return '';

  let filtersSection = '## Filters Applied\n';
  if (filters.severity?.length) {
    filtersSection += `- **Severity:** ${filters.severity.join(', ')}\n`;
  }
  if (filters.category?.length) {
    filtersSection += `- **Categories:** ${filters.category.join(', ')}\n`;
  }
  filtersSection += '\n';

  return filtersSection;
}

/**
 * Formats options for Markdown footer
 * @param options - The options object
 * @returns Markdown string for options section
 */
export function formatOptionsForMarkdown(options?: {
  maxViolations?: number;
  offset?: number;
  limit?: number;
}): string {
  if (!options) return '';

  const { maxViolations, offset, limit } = options;
  if (!maxViolations && !offset && !limit) return '';

  let optionsSection = '\n**Options Applied:**\n';
  if (maxViolations) optionsSection += `- Max violations: ${maxViolations}\n`;
  if (offset) optionsSection += `- Offset: ${offset}\n`;
  if (limit) optionsSection += `- Limit: ${limit}\n`;

  return optionsSection;
}

/**
 * Formats severity badge for Markdown display
 * @param severity - The severity level
 * @returns Markdown string for severity badge
 */
export function formatSeverityBadge(severity: string): string {
  const severityMap: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return severityMap[severity] || '⚪';
}
