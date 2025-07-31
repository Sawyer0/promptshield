/**
 * RulePack path resolution utility
 * Handles finding rulepacks in development and after npm installation
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolves the path to a rulepack file
 * Works both in development and after npm installation
 *
 * @param rulepackPath - The rulepack path (can be relative or absolute)
 * @returns The resolved absolute path to the rulepack file
 */
export function resolveRulepackPath(rulepackPath: string): string {
  // If it's already an absolute path, return as-is
  if (path.isAbsolute(rulepackPath)) {
    return rulepackPath;
  }

  // Try relative to current working directory first (development mode)
  const cwdPath = path.resolve(process.cwd(), rulepackPath);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  // Try relative to the package installation directory
  // This handles the case where the tool is installed via npm
  const packagePath = path.resolve(__dirname, '..', '..', rulepackPath);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  // Try in node_modules (for global installs)
  const nodeModulesPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'promptshield',
    rulepackPath
  );
  if (fs.existsSync(nodeModulesPath)) {
    return nodeModulesPath;
  }

  // If nothing found, return the original path and let the caller handle the error
  return rulepackPath;
}

/**
 * Gets the default rulepack path, properly resolved
 * @returns The resolved path to the default PII rulepack
 */
export function getDefaultRulepackPath(): string {
  return resolveRulepackPath('rulepacks/pii.yaml');
}

/**
 * Lists available rulepacks in the rulepacks directory
 * @returns Array of available rulepack file paths
 */
export function listAvailableRulepacks(): string[] {
  const rulepackDirs = [
    path.resolve(process.cwd(), 'rulepacks'),
    path.resolve(__dirname, '..', '..', 'rulepacks'),
    path.resolve(__dirname, '..', '..', '..', 'promptshield', 'rulepacks'),
  ];

  for (const dir of rulepackDirs) {
    if (fs.existsSync(dir)) {
      try {
        return fs
          .readdirSync(dir)
          .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
          .map((file) => path.join(dir, file));
      } catch {
        // Continue to next directory if this one fails
        continue;
      }
    }
  }

  return [];
}
