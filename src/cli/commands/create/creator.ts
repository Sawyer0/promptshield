/**
 * Creator module for create command
 * Handles the actual RulePack creation from templates.
 */
import { CreateOptions } from './types';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { getTemplate } from './templates';
import { logger } from '../../../utils/logger';

export async function createRulePack(
  name: string,
  options: CreateOptions = {}
): Promise<string> {
  // Get template content
  const template = getTemplate(options.template || 'basic', {
    name,
    description: options.description || `Custom RulePack: ${name}`,
    category: options.category || 'custom',
  });

  // Create rulepacks directory if it doesn't exist
  const rulepacksDir = 'rulepacks';
  try {
    await writeFile(join(rulepacksDir, '.gitkeep'), '');
  } catch {
    // Directory might already exist, ignore
  }

  // Write the RulePack file
  const rulePackPath = join(rulepacksDir, `${name}.yaml`);
  await writeFile(rulePackPath, template, 'utf8');

  logger.debug(`📝 Created RulePack at: ${rulePackPath}`);
  return rulePackPath;
}
