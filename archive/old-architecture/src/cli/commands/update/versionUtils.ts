/**
 * Version utilities for update command
 * Handles semantic version comparison and parsing.
 */

/**
 * Compares two semantic version strings.
 * Returns:
 *  -1 if version1 < version2
 *   0 if version1 === version2
 *   1 if version1 > version2
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = parseVersion(version1);
  const v2Parts = parseVersion(version2);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }

  return 0;
}

/**
 * Parses a semantic version string into an array of numbers.
 * Handles versions like "1.2.3", "1.0", "2.1.0-alpha.1", etc.
 */
function parseVersion(version: string): number[] {
  // Remove any pre-release or build metadata
  const cleanVersion = version.split(/[-+]/)[0];

  return cleanVersion.split('.').map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

/**
 * Validates if a string is a valid semantic version.
 */
export function isValidVersion(version: string): boolean {
  const semverRegex =
    /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  return semverRegex.test(version);
}
