/**
 * Contents module for list command
 * Handles displaying RulePack contents with filtering options.
 */
import { join } from 'path';
import { existsSync } from 'fs';
import { loadAndValidateRulePack } from '../../../core/rules';
import { logger } from '../../../utils/logger';
import { ScanOptions } from '../../validators/options';
import { handleCliError } from '../../../utils/errors';

export async function listRulePackContents(
  rulepackName: string,
  options: ScanOptions
): Promise<void> {
  const rulepackDir = 'rulepacks';

  // Handle both relative paths (rulepacks/pii.yaml) and just filenames (pii.yaml)
  let rulepackPath: string;
  let displayName: string;

  if (rulepackName.includes('/') || rulepackName.includes('\\')) {
    // Full path provided
    rulepackPath = rulepackName;
    displayName = rulepackName.split(/[/\\]/).pop() || rulepackName;
  } else {
    // Just filename provided
    rulepackPath = join(rulepackDir, rulepackName);
    displayName = rulepackName;
  }

  if (!existsSync(rulepackPath)) {
    handleCliError(
      new Error(
        `RulePack not found: ${rulepackName}. Please check the file name or add it to the rulepacks directory.`
      ),
      'list'
    );
  }

  try {
    const rules = await loadAndValidateRulePack(rulepackPath);
    logger.info(`\nRules in ${displayName}:`);

    for (const rule of rules) {
      // Apply filters
      if (options.enabledOnly && rule.enabled === false) continue;
      if (options.category && rule.category !== options.category) continue;
      if (options.severity && rule.severity !== options.severity) continue;

      logger.info(
        `  - ${rule.id} (${rule.severity})${rule.enabled === false ? ' [DISABLED]' : ''}`
      );
    }
  } catch (error) {
    handleCliError(
      new Error(
        `Failed to load RulePack ${rulepackName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
      'list'
    );
  }
}
