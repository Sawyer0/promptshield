/**
 * Shared option validation utilities for CLI commands
 * Provides consistent option validation across all commands
 */

import { validateScanOptions, validateSeverity } from '../options';
import { handleCliError } from '../../../utils/errors';
import { Severity } from '../../../types/core/severity';
import { ScanOptions } from '../options';

/**
 * Validates scan options with proper error handling
 * @param options - The scan options to validate
 * @param context - The command context for error reporting
 */
export function validateScanOptionsWithErrorHandling(
  options: ScanOptions,
  context: string = 'command'
): void {
  const validation = validateScanOptions(options);

  if (!validation.isValid) {
    const errorMessage = validation.errors.join('; ');
    handleCliError(
      new Error(
        `Invalid scan options: ${errorMessage}. Please check your CLI arguments or see the documentation at https://github.com/promptshield/promptshield-clean#cli-options`
      ),
      context
    );
  }
}

/**
 * Validates fail-on severity option
 * @param failSeverity - The fail-on severity value
 * @param context - The command context for error reporting
 */
export function validateFailOnSeverity(
  failSeverity: string | undefined,
  context: string = 'command'
): Severity | undefined {
  if (!failSeverity) return undefined;

  if (!validateSeverity(failSeverity)) {
    handleCliError(
      new Error(
        `Invalid severity level: ${failSeverity}. Use: low, medium, high, critical.`
      ),
      context
    );
  }

  return failSeverity as Severity;
}

/**
 * Validates schema option
 * @param schema - The schema option value
 * @param context - The command context for error reporting
 */
export function validateSchemaOption(
  schema: string | undefined,
  context: string = 'command'
): void {
  if (!schema) return;

  const validSchemas = ['basic', 'extended', 'flexible'];
  const isValidSchema =
    validSchemas.includes(schema) || schema.endsWith('.json');

  if (!isValidSchema) {
    handleCliError(
      new Error(
        `Invalid schema: ${schema}. Use: basic, extended, flexible, or a custom schema file path.`
      ),
      context
    );
  }
}

/**
 * Validates compression options
 * @param compress - The compression type
 * @param compressionLevel - The compression level
 * @param context - The command context for error reporting
 */
export function validateCompressionOptions(
  compress: string | undefined,
  compressionLevel: string | undefined,
  context: string = 'command'
): void {
  if (!compress) return;

  const validTypes = ['gzip', 'deflate'];
  if (!validTypes.includes(compress)) {
    handleCliError(
      new Error(`Invalid compression type: ${compress}. Use: gzip, deflate.`),
      context
    );
  }

  if (compressionLevel) {
    const level = parseInt(compressionLevel, 10);
    if (isNaN(level) || level < 0 || level > 9) {
      handleCliError(
        new Error(
          `Invalid compression level: ${compressionLevel}. Must be between 0 and 9.`
        ),
        context
      );
    }
  }
}

/**
 * Validates numeric options with range checking
 * @param value - The numeric value as string
 * @param optionName - The name of the option for error reporting
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param context - The command context for error reporting
 */
export function validateNumericOption(
  value: string | undefined,
  optionName: string,
  min: number,
  max: number,
  context: string = 'command'
): number | undefined {
  if (!value) return undefined;

  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) {
    handleCliError(
      new Error(
        `Invalid ${optionName}: ${value}. Must be a number between ${min} and ${max}.`
      ),
      context
    );
  }

  return num;
}
