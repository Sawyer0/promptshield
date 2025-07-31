/**
 * Update command runner for PromptShield CLI
 * Orchestrates the update process by delegating to specialized modules.
 */
import { UpdateOptions } from './types';
// Update validation simplified - basic option checking inline
import { performUpdate } from './updater';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function executeUpdateCommand(
  options: UpdateOptions = {}
): Promise<void> {
  try {
    // Step 1: Validate update options
    // Basic validation inline - no complex validation needed

    // Step 2: Perform the update
    await performUpdate(options);

    logger.success('RulePacks updated successfully.');
  } catch {
    handleCliError(
      new Error(
        'Failed to update RulePacks. Please check your network connection or registry URL, or see https://github.com/promptshield/promptshield-clean#rulepack-registry'
      ),
      'update'
    );
  }
}
