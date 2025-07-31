export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly errors: string[] = [],
    cause?: Error
  ) {
    super(message, cause);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, identifier: string, cause?: Error) {
    super(`${resource} not found: ${identifier}`, cause);
  }
}

export class FileSystemError extends DomainError {
  readonly code = 'FILE_SYSTEM_ERROR';
  readonly statusCode = 500;

  constructor(operation: string, path: string, cause?: Error) {
    super(`File system error during ${operation}: ${path}`, cause);
  }
}

export class RuleExecutionError extends DomainError {
  readonly code = 'RULE_EXECUTION_ERROR';
  readonly statusCode = 500;

  constructor(ruleId: string, message: string, cause?: Error) {
    super(`Rule execution failed for ${ruleId}: ${message}`, cause);
  }
}

export class ConfigurationError extends DomainError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, cause?: Error) {
    super(`Configuration error: ${message}`, cause);
  }
}

export class ProcessingError extends DomainError {
  readonly code = 'PROCESSING_ERROR';
  readonly statusCode = 500;

  constructor(message: string, cause?: Error) {
    super(`Processing error: ${message}`, cause);
  }
}

export class TimeoutError extends DomainError {
  readonly code = 'TIMEOUT_ERROR';
  readonly statusCode = 408;

  constructor(operation: string, timeoutSeconds: number, cause?: Error) {
    super(
      `Operation ${operation} timed out after ${timeoutSeconds} seconds`,
      cause
    );
  }
}

export class MemoryError extends DomainError {
  readonly code = 'MEMORY_ERROR';
  readonly statusCode = 507;

  constructor(threshold: number, current: number, cause?: Error) {
    super(
      `Memory usage (${current}%) exceeded threshold (${threshold}%)`,
      cause
    );
  }
}
