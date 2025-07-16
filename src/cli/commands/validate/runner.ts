/**
 * Validate command runner for PromptShield CLI
 * Orchestrates the validation process by delegating to specialized modules.
 */
import { ScanOptions } from '../../validators/options';
import { validateFilePath } from './validation';
import { validateFileFormat, validateRulepack } from '../../validators/options';
import { validateSchema } from './schema';
import { validateRulePackStructure } from './rulepack';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function executeValidateCommand(
  input: string,
  options: ScanOptions
): Promise<void> {
  try {
    // Step 1: Validate file path
    await validateFilePath(input);

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
      handleCliError(
        new Error(
          `RulePack file not found: ${options.rulepack}. Please check the path or use --rulepack to specify a valid RulePack YAML file.`
        ),
        'validate'
      );
    }

    // Step 4: Validate schema if provided
    if (options.schema) {
      await validateSchema(input, options.schema);
    }

    // Step 5: Validate RulePack structure if provided
    if (options.rulepack) {
      await validateRulePackStructure(options.rulepack);
    }

    logger.success('File format appears valid.');
  } catch (error) {
    handleCliError(error, 'validate');
  }
}
