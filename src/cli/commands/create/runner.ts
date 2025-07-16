/**
 * Create command runner for PromptShield CLI
 * Orchestrates the RulePack creation process by delegating to specialized modules.
 */
import { CreateOptions } from './types';
import { validateCreateOptions } from './validation';
import { createRulePack } from './creator';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function executeCreateCommand(
  name: string,
  options: CreateOptions = {}
): Promise<void> {
  try {
    // Step 1: Validate create options
    await validateCreateOptions(name, options);

    // Step 2: Create the RulePack
    const rulePackPath = await createRulePack(name, options);

    logger.success(`RulePack created successfully: ${rulePackPath}`);
    logger.info('Edit the RulePack to add your custom rules.');
  } catch (error) {
    handleCliError(
      new Error(
        `Failed to create RulePack: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
      'create'
    );
  }
}
