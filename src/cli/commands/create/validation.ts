/**
 * Validation module for create command
 * Handles validation of create options and prerequisites.
 */
import { CreateOptions } from './types';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';

export async function validateCreateOptions(
  name: string,
  options: CreateOptions
): Promise<void> {
  // Validate RulePack name
  if (!name || name.trim().length === 0) {
    handleCliError(new Error('RulePack name is required'), 'create');
  }

  // Validate name format (lowercase, hyphens, no spaces)
  const nameRegex = /^[a-z0-9-]+$/;
  if (!nameRegex.test(name)) {
    handleCliError(
      new Error(
        'RulePack name must contain only lowercase letters, numbers, and hyphens'
      ),
      'create'
    );
  }

  // Check if RulePack already exists
  const rulePackPath = join('rulepacks', `${name}.yaml`);
  if (existsSync(rulePackPath) && !options.force) {
    handleCliError(
      new Error(
        `RulePack ${name}.yaml already exists. Use --force to overwrite.`
      ),
      'create'
    );
  }

  // Validate template if provided
  if (options.template) {
    const validTemplates = ['basic', 'pii', 'bias', 'security', 'compliance'];
    if (!validTemplates.includes(options.template)) {
      handleCliError(
        new Error(
          `Invalid template: ${options.template}. Valid templates: ${validTemplates.join(', ')}`
        ),
        'create'
      );
    }
  }

  // Validate category if provided
  if (options.category) {
    const validCategories = [
      'pii',
      'bias',
      'hallucination',
      'security',
      'compliance',
      'parse',
      'internal',
      'custom',
    ];
    if (!validCategories.includes(options.category)) {
      handleCliError(
        new Error(
          `Invalid category: ${options.category}. Valid categories: ${validCategories.join(', ')}`
        ),
        'create'
      );
    }
  }

  logger.info(`Creating RulePack: ${name}.yaml`);
  if (options.template) {
    logger.info(`Using template: ${options.template}`);
  }
  if (options.category) {
    logger.info(`Category: ${options.category}`);
  }
}
