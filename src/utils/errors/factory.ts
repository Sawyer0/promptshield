import { PromptShieldError, ErrorType } from './PromptShieldError';

export function createFileNotFoundError(filePath: string): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.FILE_NOT_FOUND,
    message: `File not found: ${filePath}`,
    filePath,
    suggestion: 'Check the file path and ensure the file exists',
    exitCode: 1,
  });
}

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

export function createEmptyFileError(filePath: string): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.EMPTY_FILE,
    message: `File is empty: ${filePath}`,
    filePath,
    suggestion: 'Ensure your file contains valid data',
    exitCode: 1,
  });
}

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

export function createOutputWriteFailedError(
  outputPath: string,
  originalError?: Error
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.OUTPUT_WRITE_FAILED,
    message: `Failed to write output file: ${outputPath}`,
    filePath: outputPath,
    suggestion: 'Check disk space and file permissions',
    exitCode: 1,
    details: originalError
      ? { originalError: originalError.message }
      : undefined,
  });
}

export function createInvalidOutputFormatError(
  format: string,
  validFormats: string[]
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.INVALID_OUTPUT_FORMAT,
    message: `Invalid output format: ${format}`,
    suggestion: `Valid formats: ${validFormats.join(', ')}`,
    exitCode: 1,
    details: { validFormats },
  });
}

export function createOutputDirectoryNotFoundError(
  outputPath: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.OUTPUT_DIRECTORY_NOT_FOUND,
    message: `Output directory not found: ${outputPath}`,
    filePath: outputPath,
    suggestion: 'Create the directory or specify a valid path',
    exitCode: 1,
  });
}

export function createOutputPermissionDeniedError(
  outputPath: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.OUTPUT_PERMISSION_DENIED,
    message: `Permission denied writing to: ${outputPath}`,
    filePath: outputPath,
    suggestion:
      'Check write permissions or specify a different output location',
    exitCode: 1,
  });
}

export function createOutputDiskFullError(
  outputPath: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.OUTPUT_DISK_FULL,
    message: `Disk full: Cannot write to ${outputPath}`,
    filePath: outputPath,
    suggestion: 'Free up disk space or specify a different output location',
    exitCode: 1,
  });
}

export function createCompressionFailedError(
  outputPath: string,
  compressionType: string,
  originalError?: Error
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.COMPRESSION_FAILED,
    message: `Compression failed for ${outputPath} using ${compressionType}`,
    filePath: outputPath,
    suggestion: 'Try without compression or use a different compression type',
    exitCode: 1,
    details: originalError
      ? { originalError: originalError.message }
      : undefined,
  });
}

export function createTimeoutError(
  operation: string,
  timeoutSeconds: number
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.TIMEOUT_ERROR,
    message: `${operation} timed out after ${timeoutSeconds} seconds`,
    suggestion: 'Try with a larger timeout value or process a smaller file',
    exitCode: 1,
    details: { operation, timeoutSeconds },
  });
}

export function createMemoryError(
  operation: string,
  memoryUsage: number
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.MEMORY_ERROR,
    message: `Memory limit exceeded during ${operation}`,
    suggestion: 'Process smaller files or increase available memory',
    exitCode: 1,
    details: { operation, memoryUsage },
  });
}

export function createValidationError(
  field: string,
  value: string,
  expected: string
): PromptShieldError {
  return new PromptShieldError({
    type: ErrorType.VALIDATION_ERROR,
    message: `Invalid ${field}: ${value}`,
    suggestion: `Expected: ${expected}`,
    exitCode: 1,
    details: { field, value, expected },
  });
}

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

export function handleFileSystemError(
  error: NodeJS.ErrnoException,
  filePath: string
): PromptShieldError {
  switch (error.code) {
    case 'ENOENT':
      return createFileNotFoundError(filePath);
    case 'EACCES':
      return createPermissionDeniedError(filePath);
    case 'ENOSPC':
      return createOutputDiskFullError(filePath);
    default:
      return createUnknownError(error.message, error);
  }
}

export function handleOutputFileSystemError(
  error: NodeJS.ErrnoException,
  outputPath: string
): PromptShieldError {
  switch (error.code) {
    case 'ENOENT':
      return createOutputDirectoryNotFoundError(outputPath);
    case 'EACCES':
      return createOutputPermissionDeniedError(outputPath);
    case 'ENOSPC':
      return createOutputDiskFullError(outputPath);
    default:
      return createOutputWriteFailedError(outputPath, error);
  }
}
