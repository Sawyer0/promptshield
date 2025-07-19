/**
 * Error types for PromptShield
 */
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_JSON = 'INVALID_JSON',
  INVALID_JSON_STRUCTURE = 'INVALID_JSON_STRUCTURE',
  EMPTY_FILE = 'EMPTY_FILE',
  INVALID_RULEPACK = 'INVALID_RULEPACK',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  OUTPUT_WRITE_FAILED = 'OUTPUT_WRITE_FAILED',
  INVALID_OUTPUT_FORMAT = 'INVALID_OUTPUT_FORMAT',
  OUTPUT_DIRECTORY_NOT_FOUND = 'OUTPUT_DIRECTORY_NOT_FOUND',
  OUTPUT_PERMISSION_DENIED = 'OUTPUT_PERMISSION_DENIED',
  OUTPUT_DISK_FULL = 'OUTPUT_DISK_FULL',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface PromptShieldErrorData {
  type: ErrorType;
  message: string;
  filePath?: string;
  lineNumber?: number;
  suggestion?: string;
  exitCode: number;
  details?: Record<string, unknown>;
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
  public readonly details?: Record<string, unknown>;

  constructor(error: PromptShieldErrorData) {
    super(error.message);
    this.name = 'PromptShieldError';
    this.type = error.type;
    this.filePath = error.filePath;
    this.lineNumber = error.lineNumber;
    this.suggestion = error.suggestion;
    this.exitCode = error.exitCode;
    this.details = error.details;
  }
}
