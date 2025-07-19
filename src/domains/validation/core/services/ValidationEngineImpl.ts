import { Result, ok, err } from '../../../../shared/types/Result';
import { ValidationEngine } from '../ports/ValidationEngine';
import { ValidationResult } from '../entities/ValidationResult';
import { ValidationOptions } from '../entities/ValidationOptions';
import { Validator } from '../ports/Validator';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Default validation engine implementation
 */
export class DefaultValidationEngine implements ValidationEngine {
  private validators = new Map<string, Validator>();

  constructor() {
    // Register default validators will be done by dependency injection
  }

  async validate(
    target: string,
    options: ValidationOptions
  ): Promise<Result<ValidationResult, Error>> {
    try {
      // Determine validation type based on target
      const validationType = this.determineValidationType(target);

      // Get appropriate validator
      const validator = this.validators.get(validationType);
      if (!validator) {
        return err(new Error(`No validator found for type: ${validationType}`));
      }

      // Check if validator supports this target
      if (!validator.supports(target, options)) {
        return err(new Error(`Validator does not support target: ${target}`));
      }

      // Perform validation
      return await validator.validate(target, options);
    } catch (error) {
      return err(new Error(`Validation failed: ${error}`));
    }
  }

  async validateBatch(
    targets: string[],
    options: ValidationOptions
  ): Promise<Result<ValidationResult[], Error>> {
    try {
      const results: ValidationResult[] = [];

      for (const target of targets) {
        const result = await this.validate(target, options);
        if (result.isErr()) {
          return err(result.error);
        }
        results.push(result.value);
      }

      return ok(results);
    } catch (error) {
      return err(new Error(`Batch validation failed: ${error}`));
    }
  }

  registerValidator(type: string, validator: Validator): void {
    this.validators.set(type, validator);
  }

  getSupportedTypes(): string[] {
    return Array.from(this.validators.keys());
  }

  private determineValidationType(target: string): string {
    // Check if target exists
    if (!fs.existsSync(target)) {
      return 'unknown';
    }

    const ext = path.extname(target).toLowerCase();
    const basename = path.basename(target).toLowerCase();

    // RulePack files
    if (ext === '.yaml' || ext === '.yml') {
      return 'rulepack';
    }

    // Input files
    if (
      ext === '.json' ||
      ext === '.ndjson' ||
      ext === '.jsonl' ||
      ext === '.txt'
    ) {
      return 'input-file';
    }

    // Config files
    if (basename.includes('config') || basename.includes('settings')) {
      return 'config';
    }

    // Default to input file
    return 'input-file';
  }
}
