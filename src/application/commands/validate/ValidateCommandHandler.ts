import { Result, ok, err } from '../../../shared/types/Result';
import { ValidateCommand } from './ValidateCommand';
import { ValidationEngine } from '../../../domains/validation/core/ports/ValidationEngine';
import {
  ValidationOptions,
  ValidationOptionsBuilder,
} from '../../../domains/validation/core/entities/ValidationOptions';
import { ValidationResult } from '../../../domains/validation/core/entities/ValidationResult';
import { Logger } from '../../../infrastructure/logging/Logger';

/**
 * Validate command handler
 */
export class ValidateCommandHandler {
  constructor(
    private readonly validationEngine: ValidationEngine,
    private readonly logger: Logger
  ) {}

  async execute(
    command: ValidateCommand
  ): Promise<Result<ValidationResult, Error>> {
    try {
      this.logger.info('Starting validation', { target: command.target });

      const validationOptions = this.buildValidationOptions(command.options);

      const result = await this.validationEngine.validate(
        command.target,
        validationOptions
      );

      if (result.isErr()) {
        this.logger.error('Validation failed', result.error);
        return result;
      }

      const validationResult = result.value;

      this.logValidationResult(validationResult, command.options);

      this.displayValidationResult(validationResult, command.options);

      return ok(validationResult);
    } catch (error) {
      this.logger.error('Validation execution failed', error as Error);
      return err(new Error(`Validation execution failed: ${error}`));
    }
  }

  private buildValidationOptions(
    cmdOptions: ValidateCommand['options']
  ): ValidationOptions {
    const builder = new ValidationOptionsBuilder();

    if (cmdOptions.strict !== undefined) {
      builder.strict(cmdOptions.strict);
    }

    if (cmdOptions.verbose !== undefined) {
      builder.verbose(cmdOptions.verbose);
    }

    if (cmdOptions.skipWarnings !== undefined) {
      builder.skipWarnings(cmdOptions.skipWarnings);
    }

    if (cmdOptions.maxErrors !== undefined) {
      builder.maxErrors(cmdOptions.maxErrors);
    }

    if (cmdOptions.format !== undefined) {
      builder.format(cmdOptions.format);
    }

    return builder.build();
  }

  private logValidationResult(
    result: ValidationResult,
    options: ValidateCommand['options']
  ): void {
    const { target, isValid, errors, warnings } = result;

    if (isValid) {
      this.logger.info('Validation completed successfully', {
        target,
        warnings: warnings.length,
        verbose: options.verbose,
      });
    } else {
      this.logger.error(
        'Validation failed',
        new Error(`Validation failed for ${target}`),
        {
          target,
          errors: errors.length,
          warnings: warnings.length,
          verbose: options.verbose,
        }
      );
    }
  }

  private displayValidationResult(
    result: ValidationResult,
    options: ValidateCommand['options']
  ): void {
    const outputFormat = options.output || 'table';

    switch (outputFormat) {
      case 'json':
        this.displayJsonResult(result);
        break;
      case 'summary':
        this.displaySummaryResult(result);
        break;
      case 'table':
      default:
        this.displayTableResult(result, options);
        break;
    }
  }

  private displayJsonResult(result: ValidationResult): void {
    console.log(JSON.stringify(result, null, 2));
  }

  private displaySummaryResult(result: ValidationResult): void {
    const { target, isValid, errors, warnings, validationType } = result;

    console.log(`\n📋 Validation Summary for ${target}`);
    console.log(`Type: ${validationType}`);
    console.log(`Status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
  }

  private displayTableResult(
    result: ValidationResult,
    options: ValidateCommand['options']
  ): void {
    const { target, isValid, errors, warnings, validationType } = result;

    console.log(`\n🔍 Validation Report for ${target}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Type: ${validationType}`);
    console.log(`Status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log();

    if (errors.length > 0) {
      console.log('🚨 Errors:');
      console.log('─'.repeat(30));
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.field}: ${error.message}`);
        if (error.line !== undefined) {
          console.log(
            `   Line: ${error.line}${error.column ? `, Column: ${error.column}` : ''}`
          );
        }
        console.log(`   Code: ${error.code}\n`);
      });
    }

    // Display warnings (unless skipped)
    if (warnings.length > 0 && !options.skipWarnings) {
      console.log('⚠️  Warnings:');
      console.log('─'.repeat(30));
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.field}: ${warning.message}`);
        if (warning.line !== undefined) {
          console.log(
            `   Line: ${warning.line}${warning.column ? `, Column: ${warning.column}` : ''}`
          );
        }
        console.log(`   Code: ${warning.code}\n`);
      });
    }

    if (isValid) {
      console.log('✅ Validation passed successfully!');
      if (warnings.length > 0) {
        console.log(
          `   Note: ${warnings.length} warning${warnings.length > 1 ? 's' : ''} found`
        );
      }
    } else {
      console.log('❌ Validation failed. Please fix the errors above.');
    }

    console.log();
  }
}
