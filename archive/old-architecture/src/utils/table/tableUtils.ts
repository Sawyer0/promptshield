/**
 * Table utility functions for PromptShield
 * Provides table formatting and display utilities
 */

/**
 * Pads a string to a specified width
 * @param str - The string to pad
 * @param width - The target width
 * @returns The padded string
 */
export function padString(str: string, width: number): string {
  return str.padEnd(width);
}

/**
 * Truncates a string if it exceeds the maximum length
 * @param str - The string to truncate
 * @param maxLength - The maximum length
 * @param suffix - The suffix to add when truncated (default: '...')
 * @returns The truncated string
 */
export function truncateString(
  str: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Creates a table header row
 * @returns The table header as a string
 */
export function createTableHeader(): string {
  const severity = padString('Severity', 10);
  const category = padString('Category', 12);
  const ruleId = padString('Rule ID', 15);
  const message = padString('Message', 40);

  return `  ${ruleId} | ${severity} | ${category} | ${message}\n`;
}

/**
 * Creates a table row from violation data
 * @param violation - The violation object
 * @returns The table row as a string
 */
export function createTableRow(violation: {
  severity: string;
  category: string;
  ruleId: string;
  message: string;
  objectIndex?: number;
  field?: string;
  lineNumber?: number;
  file?: string;
}): string {
  const severity = padString(violation.severity, 10);
  const category = padString(violation.category, 12);
  const ruleId = padString(violation.ruleId, 15);

  // Truncate message if too long
  let message = violation.message;
  if (message.length > 37) {
    message = truncateString(message, 37);
  }
  message = padString(message, 40);

  let context = '';
  if (violation.objectIndex !== undefined && violation.field) {
    context = ` [Obj:${violation.objectIndex}, Field:${violation.field}]`;
  } else if (violation.field) {
    context = ` [Field:${violation.field}]`;
  } else if (violation.lineNumber && violation.file) {
    context = ` [${violation.file}:${violation.lineNumber}]`;
  } else if (violation.lineNumber) {
    context = ` [Line:${violation.lineNumber}]`;
  }

  return `  ${ruleId} | ${severity} | ${category} | ${message}${context}\n`;
}

/**
 * Formats filters for table display
 * @param filters - The filters object
 * @returns Table string for filters section
 */
export function formatFiltersForTable(filters?: {
  severity?: string[];
  category?: string[];
}): string {
  if (!filters) return '';

  let filtersSection = 'Filters Applied:\n';
  if (filters.severity?.length) {
    filtersSection += `  Severity: ${filters.severity.join(', ')}\n`;
  }
  if (filters.category?.length) {
    filtersSection += `  Categories: ${filters.category.join(', ')}\n`;
  }
  filtersSection += '\n';

  return filtersSection;
}

/**
 * Gets severity icon for table display
 * @param severity - The severity level
 * @returns Icon string
 */
export function getSeverityIcon(severity: string): string {
  const iconMap: Record<string, string> = {
    critical: '🚨',
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  return iconMap[severity.toLowerCase()] || '⚪';
}

/**
 * Creates a separator line for table formatting
 * @param length - The length of the separator
 * @param char - The character to use (default: '-')
 * @returns The separator string
 */
export function createSeparator(length: number, char: string = '-'): string {
  return char.repeat(length) + '\n';
}
