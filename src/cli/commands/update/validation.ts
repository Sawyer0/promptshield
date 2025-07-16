/**
 * Validation module for update command
 * Handles validation of update options and prerequisites.
 */
import { UpdateOptions } from './types';
import { logger } from '../../../utils/logger';
import { loadAndValidateRulePack } from '../../../core/rules';

export async function validateUpdateOptions(
  options: UpdateOptions
): Promise<void> {
  if (options.force) {
    logger.info('Force update enabled');
  }

  if (options.registry) {
    logger.info(`Using custom registry: ${options.registry}`);
  }

  // Add any additional validation logic here
  // For example, checking network connectivity, registry accessibility, etc.
}

/**
 * Validates a RulePack file by attempting to load and parse it.
 */
export async function validateRulePackFile(filePath: string): Promise<void> {
  try {
    await loadAndValidateRulePack(filePath);
  } catch (error) {
    throw new Error(
      `Invalid RulePack file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
