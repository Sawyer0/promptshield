/**
 * Local updater module for update command
 * Handles checking for updates in a local updates/ directory.
 */
import { UpdateOptions } from './types';
import { logger } from '../../../utils/logger';
import { compareVersions } from './versionUtils';

interface UpdateInfo {
  name: string;
  version: string;
  filePath: string;
  source: 'local' | 'remote';
}

export async function checkForLocalUpdates(
  options: UpdateOptions
): Promise<UpdateInfo[]> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const updatesDir = 'updates';
  const rulepacksDir = 'rulepacks';

  // Check if updates directory exists
  try {
    await fs.access(updatesDir);
  } catch {
    logger.debug('📁 No local updates directory found');
    return [];
  }

  const updates: UpdateInfo[] = [];

  try {
    // Read all files in updates directory
    const files = await fs.readdir(updatesDir);
    const yamlFiles = files.filter(
      (f) => f.endsWith('.yaml') || f.endsWith('.yml')
    );

    for (const file of yamlFiles) {
      const updatePath = path.join(updatesDir, file);
      const rulepackPath = path.join(rulepacksDir, file);

      try {
        // Check if this RulePack exists locally
        const localExists = await fs
          .access(rulepackPath)
          .then(() => true)
          .catch(() => false);

        if (!localExists) {
          // New RulePack, add it
          const version = await getRulePackVersion(updatePath);
          updates.push({
            name: file,
            version,
            filePath: updatePath,
            source: 'local',
          });
          logger.debug(`🆕 Found new RulePack: ${file} (v${version})`);
        } else {
          // Compare versions
          const localVersion = await getRulePackVersion(rulepackPath);
          const updateVersion = await getRulePackVersion(updatePath);

          if (
            compareVersions(updateVersion, localVersion) > 0 ||
            options.force
          ) {
            updates.push({
              name: file,
              version: updateVersion,
              filePath: updatePath,
              source: 'local',
            });
            logger.debug(
              `🔄 Found update: ${file} (${localVersion} -> ${updateVersion})`
            );
          }
        }
      } catch (error) {
        logger.warn(
          `Failed to process ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  } catch (error) {
    logger.warn(
      `Failed to read updates directory: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return updates;
}

async function getRulePackVersion(filePath: string): Promise<string> {
  const fs = await import('fs/promises');
  const yaml = await import('js-yaml');

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const rulepack = yaml.load(content) as Record<string, unknown>;

    if (typeof rulepack.version === 'string') {
      return rulepack.version;
    }

    // Fallback to '1.0.0' if no version found
    return '1.0.0';
  } catch (error) {
    logger.warn(
      `Failed to read version from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return '1.0.0';
  }
}
