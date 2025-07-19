import { PromptShieldError, ErrorType } from './PromptShieldError';

/**
 * Formats an error for CLI output with color coding
 */
export function formatErrorForCLI(error: PromptShieldError): string {
  const parts: string[] = [];

  // Main error message
  parts.push(`Error: ${error.message}`);

  // Add line number if available
  if (error.lineNumber) {
    parts.push(`Line: ${error.lineNumber}`);
  }

  // Add file path if available
  if (error.filePath) {
    parts.push(`File: ${error.filePath}`);
  }

  // Add suggestion if available
  if (error.suggestion) {
    parts.push(`Suggestion: ${error.suggestion}`);
  }

  // Add details if available
  if (error.details) {
    const detailParts = Object.entries(error.details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    if (detailParts) {
      parts.push(`Details: ${detailParts}`);
    }
  }

  return parts.join('\n  ');
}

/**
 * Gets the appropriate exit code for an error
 */
export function getExitCode(error: PromptShieldError): number {
  return error.exitCode;
}

/**
 * Determines if an error should be treated as a warning in strict mode
 */
export function isWarningError(error: PromptShieldError): boolean {
  return [ErrorType.EMPTY_FILE, ErrorType.VALIDATION_ERROR].includes(
    error.type
  );
}

/**
 * Creates a user-friendly error summary
 */
export function createErrorSummary(errors: PromptShieldError[]): string {
  const errorCounts = new Map<ErrorType, number>();

  errors.forEach((error) => {
    const count = errorCounts.get(error.type) || 0;
    errorCounts.set(error.type, count + 1);
  });

  const summary = Array.from(errorCounts.entries())
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');

  return `Error Summary: ${summary}`;
}
