/**
 * RulePack validation module for validate command
 * Handles RulePack structure validation and loading.
 */
import { loadAndValidateRulePack } from '../../../core/rules';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function validateRulePackStructure(
  rulepackPath: string
): Promise<void> {
  try {
    await loadAndValidateRulePack(rulepackPath);
    logger.success('RulePack validation passed.');
  } catch (error) {
    handleCliError(
      new Error(
        `RulePack validation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the RulePack structure and syntax.`
      ),
      'validate'
    );
  }
}
