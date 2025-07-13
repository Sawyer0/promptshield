/**
 * Centralized error handling for PromptShield
 * Provides custom error types and actionable error messages
 */

export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_JSON = 'INVALID_JSON',
  INVALID_JSON_STRUCTURE = 'INVALID_JSON_STRUCTURE',
  EMPTY_FILE = 'EMPTY_FILE',
  INVALID_RULEPACK = 'INVALID_RULEPACK',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface PromptShieldErrorData {
  type: ErrorType;
  message: string;
  filePath?: string;
  lineNumber?: number;
  suggestion?: string;
  exitCode: number;
}

/**
 * Custom error class for PromptShield errors
 */
export class PromptShieldError extends Error {
  public readonly type: ErrorType;
  public readonly filePath?: string;
  public readonly lineNumber?: number;
  public readonly suggestion?: string;
  public readonly exitCode: number;

  constructor(error: PromptShieldErrorData) {
    super(error.message);
    this.name = 'PromptShieldError';
    this.type = error.type;
    this.filePath = error.filePath;
    this.lineNumber = error.lineNumber;
    this.suggestion = error.suggestion;
    this.exitCode = error.exitCode;
  }
}

/**
 * Creates a file not found error
 */
export function createFileNotFoundError(filePath: string): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.FILE_NOT_FOUND,
    message: `File not found: ${filePath}`,
    filePath,
    suggestion: 'Check the file path and ensure the file exists',
    exitCode: 1,
  });
}

/**
 * Creates a permission denied error
 */
export function createPermissionDeniedError(
  filePath: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.PERMISSION_DENIED,
    message: `Permission denied: ${filePath}`,
    filePath,
    suggestion: 'Check file permissions or run with appropriate privileges',
    exitCode: 1,
  });
}

/**
 * Creates an invalid JSON error
 */
export function createInvalidJsonError(
  filePath: string,
  message: string,
  lineNumber?: number
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.INVALID_JSON,
    message: `Invalid JSON in ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}: ${message}`,
    filePath,
    lineNumber,
    suggestion: 'Validate your JSON syntax using a JSON validator tool',
    exitCode: 1,
  });
}

/**
 * Creates an invalid JSON structure error
 */
export function createInvalidJsonStructureError(
  filePath: string,
  message: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.INVALID_JSON_STRUCTURE,
    message: `Invalid JSON structure in ${filePath}: ${message}`,
    filePath,
    suggestion: 'Your JSON file must contain an array of objects',
    exitCode: 1,
  });
}

/**
 * Creates an empty file error
 */
export function createEmptyFileError(filePath: string): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.EMPTY_FILE,
    message: `File is empty: ${filePath}`,
    filePath,
    suggestion: 'Ensure your file contains valid data',
    exitCode: 1,
  });
}

/**
 * Creates an invalid RulePack error
 */
export function createInvalidRulePackError(
  rulePackPath: string,
  message: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.INVALID_RULEPACK,
    message: `Invalid RulePack ${rulePackPath}: ${message}`,
    filePath: rulePackPath,
    suggestion: 'Check the RulePack YAML syntax and structure',
    exitCode: 1,
  });
}

/**
 * Creates an unsupported file type error
 */
export function createUnsupportedFileTypeError(
  filePath: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.UNSUPPORTED_FILE_TYPE,
    message: `Unsupported file type: ${filePath}`,
    filePath,
    suggestion: 'Supported formats: .json, .ndjson, .txt',
    exitCode: 1,
  });
}

/**
 * Creates an unknown error
 */
export function createUnknownError(
  message: string,
  originalError?: Error
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.UNKNOWN_ERROR,
    message: `Unexpected error: ${message}`,
    suggestion: originalError
      ? `Original error: ${originalError.message}`
      : 'Check the file and try again',
    exitCode: 1,
  });
}

/**
 * Handles file system errors and converts them to PromptShield errors
 */
export function handleFileSystemError(
  error: NodeJS.ErrnoException,
  filePath: string
): PromptShieldError {
  switch (error.code) {
    case 'ENOENT':
      return createFileNotFoundError(filePath);
    case 'EACCES':
      return createPermissionDeniedError(filePath);
    default:
      return createUnknownError(error.message, error);
  }
}

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

  // Add suggestion if available
  if (error.suggestion) {
    parts.push(`Suggestion: ${error.suggestion}`);
  }

  return parts.join('\n');
}

/**
 * Gets the appropriate exit code for an error
 */
export function getExitCode(error: PromptShieldError): number {
  return error.exitCode;
}
