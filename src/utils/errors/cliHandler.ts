import { PromptShieldError } from './PromptShieldError';
import { formatErrorForCLI, getExitCode } from './formatting';
import { logger } from '../logger';

/**
 * Centralized handler for CLI errors
 * Logs actionable error messages and exits with the appropriate code
 */
export function handleCliError(error: unknown, context?: string): never {
  let exitCode = 1;

  // Detect if JSON output is requested (via env only)
  const outputFormat = process.env.PS_OUTPUT_FORMAT;
  const isJsonOutput = outputFormat === 'json';

  let errorObj: Record<string, unknown> = {
    success: false,
    error: {},
  };

  if (error instanceof PromptShieldError) {
    const formatted = formatErrorForCLI(error);
    if (isJsonOutput) {
      errorObj.error = {
        message: error.message,
        code: error.type,
        suggestion: error.suggestion,
        details: error.details,
        filePath: error.filePath,
        lineNumber: error.lineNumber,
        exitCode: getExitCode(error),
      };
      console.error(JSON.stringify(errorObj, null, 2));
    } else if (context) {
      logger.error(`[${context}] ${formatted}`);
    } else {
      logger.error(formatted);
    }
    exitCode = getExitCode(error);
  } else if (error instanceof Error) {
    if (isJsonOutput) {
      errorObj.error = {
        message: error.message,
        code: 'UNEXPECTED_ERROR',
        exitCode,
      };
      console.error(JSON.stringify(errorObj, null, 2));
    } else if (context) {
      logger.error(`[${context}] Unexpected error: ${error.message}`);
    } else {
      logger.error(`Unexpected error: ${error.message}`);
    }
  } else {
    if (isJsonOutput) {
      errorObj.error = {
        message: String(error),
        code: 'UNKNOWN_ERROR',
        exitCode,
      };
      console.error(JSON.stringify(errorObj, null, 2));
    } else if (context) {
      logger.error(`[${context}] Unknown error: ${String(error)}`);
    } else {
      logger.error(`Unknown error: ${String(error)}`);
    }
  }
  process.exit(exitCode);
}
