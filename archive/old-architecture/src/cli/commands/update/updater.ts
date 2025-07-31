/**
 * Updater module for update command
 * Handles the actual update operation for RulePacks.
 * Supports local updates and can be extended for remote registries.
 */
import { UpdateOptions } from './types';
import { logger } from '../../../utils/logger';
import { checkForLocalUpdates } from './localUpdater';
import { checkForRemoteUpdates } from './remoteUpdater';
import { validateRulepack } from '../../../validation';
import { handleCliError } from '../../../utils/errors';

export async function performUpdate(options: UpdateOptions): Promise<void> {
  try {
    logger.info('🔄 Checking for RulePack updates...');

    let updatesFound = 0;
    let updatesApplied = 0;

    // Step 1: Check for local updates (development/testing)
    const localUpdates = await checkForLocalUpdates(options);
    updatesFound += localUpdates.length;

    // Step 2: Check for remote updates (if registry specified)
    if (options.registry) {
      const remoteUpdates = await checkForRemoteUpdates(options);
      updatesFound += remoteUpdates.length;
    }

    // Step 3: Apply updates
    for (const update of [
      ...localUpdates,
      ...(options.registry ? await checkForRemoteUpdates(options) : []),
    ]) {
      try {
        if (!validateRulepack(update.filePath)) {
          throw new Error(`Invalid RulePack: ${update.filePath}`);
        }
        await applyUpdate(update);
        updatesApplied++;
        logger.success(`Updated ${update.name} to version ${update.version}`);
      } catch (error) {
        logger.warn(
          `Failed to update ${update.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Step 4: Report results
    if (updatesFound === 0) {
      logger.info('All RulePacks are up to date.');
    } else if (updatesApplied === 0) {
      logger.warn('No updates were applied due to validation errors.');
    } else {
      logger.success(
        `Successfully applied ${updatesApplied} of ${updatesFound} updates.`
      );
    }
  } catch (error) {
    handleCliError(
      new Error(
        `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ),
      'update'
    );
  }
}

interface UpdateInfo {
  name: string;
  version: string;
  filePath: string;
  source: 'local' | 'remote';
}

async function applyUpdate(update: UpdateInfo): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const targetPath = path.join('rulepacks', update.name);

  // Create backup of existing file
  try {
    await fs.access(targetPath);
    const backupPath = `${targetPath}.backup.${Date.now()}`;
    await fs.copyFile(targetPath, backupPath);
    logger.debug(`📋 Created backup: ${backupPath}`);
  } catch {
    // File doesn't exist, no backup needed
  }

  // Copy the update to rulepacks directory
  await fs.copyFile(update.filePath, targetPath);
  logger.debug(`📝 Applied update: ${update.name} -> ${targetPath}`);
}
