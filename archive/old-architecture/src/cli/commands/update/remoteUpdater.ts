/**
 * Remote updater module for update command
 * Handles checking for updates from remote registries (GitHub, HTTP, etc.).
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

interface RemoteRulePack {
  name: string;
  version: string;
  url: string;
}

export async function checkForRemoteUpdates(
  options: UpdateOptions
): Promise<UpdateInfo[]> {
  if (!options.registry) {
    return [];
  }

  try {
    logger.debug(`🌐 Checking remote registry: ${options.registry}`);

    // Download manifest from registry
    const manifest = await downloadManifest(options.registry);

    const updates: UpdateInfo[] = [];

    for (const rulepack of manifest) {
      try {
        const localVersion = await getLocalRulePackVersion(rulepack.name);
        const remoteVersion = rulepack.version;

        if (
          !localVersion ||
          compareVersions(remoteVersion, localVersion) > 0 ||
          options.force
        ) {
          const tempPath = await downloadRulePack(rulepack.url, rulepack.name);

          updates.push({
            name: rulepack.name,
            version: remoteVersion,
            filePath: tempPath,
            source: 'remote',
          });

          logger.debug(
            `🔄 Found remote update: ${rulepack.name} (${localVersion || 'none'} -> ${remoteVersion})`
          );
        }
      } catch (error) {
        logger.warn(
          `Failed to process remote RulePack ${rulepack.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return updates;
  } catch (error) {
    logger.warn(
      `Failed to check remote registry: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return [];
  }
}

async function downloadManifest(
  registryUrl: string
): Promise<RemoteRulePack[]> {
  const https = await import('https');
  const http = await import('http');

  return new Promise((resolve, reject) => {
    const url = new URL(registryUrl);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(
          new Error(`Failed to download manifest: HTTP ${res.statusCode}`)
        );
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const manifest = JSON.parse(data) as RemoteRulePack[];
          resolve(manifest);
        } catch (error) {
          reject(
            new Error(
              `Invalid manifest format: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function downloadRulePack(url: string, name: string): Promise<string> {
  const https = await import('https');
  const http = await import('http');
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `promptshield-${name}-${Date.now()}`);

    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(
          new Error(`Failed to download RulePack: HTTP ${res.statusCode}`)
        );
        return;
      }

      const file = fs.createWriteStream(tempPath);
      res.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(tempPath);
      });

      file.on('error', async (error: Error) => {
        try {
          await fs.promises.unlink(tempPath);
        } catch {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to write RulePack: ${error.message}`));
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function getLocalRulePackVersion(name: string): Promise<string | null> {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const rulepackPath = path.join('rulepacks', name);
    await fs.access(rulepackPath);

    const yaml = await import('js-yaml');
    const content = await fs.readFile(rulepackPath, 'utf8');
    const rulepack = yaml.load(content) as Record<string, unknown>;

    if (typeof rulepack.version === 'string') {
      return rulepack.version;
    }

    return '1.0.0';
  } catch {
    return null; // File doesn't exist
  }
}
