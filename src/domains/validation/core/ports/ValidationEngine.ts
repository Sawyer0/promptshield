import { Result } from '../../../../shared/types/Result';
import { ValidationResult } from '../entities/ValidationResult';
import { ValidationOptions } from '../entities/ValidationOptions';
import { Validator } from './Validator';

/**
 * Main validation engine port
 */
export interface ValidationEngine {
  /**
   * Validates a target (file, rulepack, config) based on its type
   */
  validate(
    target: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>>;

  /**
   * Validates multiple targets in batch
   */
  validateBatch(
    targets: string[],
    options: ValidationOptions
  ): Promise<Result<ValidationResult[], Error>>;

  /**
   * Registers a validator for a specific type
   */
  registerValidator(type: string, validator: Validator): void;

  /**
   * Gets supported validation types
   */
  getSupportedTypes(): string[];
}
