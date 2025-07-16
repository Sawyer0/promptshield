/**
 * List command runner for PromptShield CLI
 * Orchestrates the listing process by delegating to specialized modules.
 */
import { ScanOptions } from '../../validators/options';
import { validateRulepackDirectory } from './validation';
import { listAvailableRulePacks } from './discovery';
import { listRulePackContents } from './contents';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function executeListCommand(options: ScanOptions): Promise<void> {
  try {
    // Step 1: Validate rulepack directory exists
    await validateRulepackDirectory();

    // Step 2: List available RulePacks
    const rulePacks = await listAvailableRulePacks();

    if (rulePacks.length === 0) {
      logger.warn(
        'No RulePacks found. Add YAML files to the rulepacks directory. See https://github.com/promptshield/promptshield-clean#rulepacks'
      );
      return;
    }

    // Step 3: Display available RulePacks
    logger.info('Available RulePacks:');
    for (const rulePack of rulePacks) {
      logger.info(`  - ${rulePack}`);
    }

    // Step 4: List specific RulePack contents if requested
    if (options.rulepack) {
      await listRulePackContents(options.rulepack, options);
    }
  } catch (error) {
    handleCliError(error, 'list');
  }
}
