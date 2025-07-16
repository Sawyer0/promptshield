/**
 * Validation module for validate command
 * Handles file path validation and related checks.
 */
import {
  validateFilePath as validatePath,
  logValidationResults,
} from '../../../utils/configValidator';
import { handleCliError } from '../../../utils/errors';

export async function validateFilePath(input: string): Promise<void> {
  const pathValidation = validatePath(input);
  logValidationResults(pathValidation, 'File path');

  if (!pathValidation.isValid) {
    handleCliError(
      new Error(
        `Invalid file path: ${input}. Please check the path and ensure the file exists. See https://github.com/promptshield/promptshield-clean#input-files`
      ),
      'validate'
    );
  }
}
