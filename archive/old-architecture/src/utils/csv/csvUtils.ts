/**
 * CSV utility functions for PromptShield
 * Provides safe CSV field escaping and formatting
 */

/**
 * Escapes a CSV field to prevent injection and ensure proper formatting
 * @param field - The field value to escape
 * @returns The escaped CSV field
 */
export function escapeCsvField(field: string): string {
  if (!field) return '';

  // Prevent CSV injection: prefix dangerous values with '
  if (/^[=+\-@]/.test(field)) {
    field = "'" + field;
  }

  // Escape quotes by doubling them
  const escaped = field.replace(/"/g, '""');

  // Wrap in quotes if contains comma, quote, or newline
  if (
    escaped.includes(',') ||
    escaped.includes('"') ||
    escaped.includes('\n')
  ) {
    return `"${escaped}"`;
  }

  return escaped;
}

/**
 * Creates a CSV row from an array of fields
 * @param fields - Array of field values
 * @returns The CSV row as a string
 */
export function createCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',');
}

/**
 * Creates CSV headers from an array of header names
 * @param headers - Array of header names
 * @returns The CSV headers as a string
 */
export function createCsvHeaders(headers: string[]): string {
  return createCsvRow(headers);
}
