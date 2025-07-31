/**
 * Validate command runner for PromptShield CLI
 * Orchestrates the validation process by delegating to specialized modules.
 */
import { ScanOptions } from '../../validators/options';
import { validateFile, validateRulepack } from '../../../validation';
import { validateFileFormat } from '../../validators/options';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function executeValidateCommand(
  input: string,
  options: ScanOptions
): Promise<void> {
  try {
    // Step 1: Validate file exists
    if (!validateFile(input)) {
      throw new Error(`File not found: ${input}`);
    }

    // Step 2: Validate file format
    if (!validateFileFormat(input, options.ndjson)) {
      handleCliError(
        new Error(
          'Unsupported file format. Try: .json, .ndjson, .jsonl, or .txt input. See https://github.com/promptshield/promptshield-clean#supported-formats'
        ),
        'validate'
      );
    }

    // Step 3: Validate RulePack if provided
    if (options.rulepack && !validateRulepack(options.rulepack)) {
      throw new Error(`RulePack file not found: ${options.rulepack}`);
    }

    logger.success('File format appears valid.');
  } catch (error) {
    handleCliError(error, 'validate');
  }
}
