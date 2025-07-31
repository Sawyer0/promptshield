/**
 * Validation result entity
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly line?: number;
  readonly column?: number;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationError[];
  readonly target: string; // File path or identifier
  readonly validationType: 'rulepack' | 'input-file' | 'config';
}

export class ValidationResultBuilder {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  constructor(
    private readonly target: string,
    private readonly validationType: ValidationResult['validationType']
  ) {}

  addError(
    field: string,
    message: string,
    code: string,
    line?: number,
    column?: number
  ): this {
    this.errors.push({
      field,
      message,
      code,
      severity: 'error',
      line,
      column,
    });
    return this;
  }

  addWarning(
    field: string,
    message: string,
    code: string,
    line?: number,
    column?: number
  ): this {
    this.warnings.push({
      field,
      message,
      code,
      severity: 'warning',
      line,
      column,
    });
    return this;
  }

  build(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
      target: this.target,
      validationType: this.validationType,
    };
  }
}
