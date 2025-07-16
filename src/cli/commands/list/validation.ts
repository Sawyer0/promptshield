/**
 * Validation module for list command
 * Handles rulepack directory validation.
 */
import { existsSync } from 'fs';
import { handleCliError } from '../../../utils/errors';

export async function validateRulepackDirectory(): Promise<void> {
  const rulepackDir = 'rulepacks';
  if (!existsSync(rulepackDir)) {
    handleCliError(
      new Error(
        'No rulepacks directory found. Please ensure the "rulepacks" directory exists in your project root. See https://github.com/promptshield/promptshield-clean#rulepacks'
      ),
      'list'
    );
  }
}
