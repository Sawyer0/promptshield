/**
 * Utility functions for PromptShield
 */

import fs from 'fs';
import glob from 'glob';

/**
 * Read file content
 * @param filePath - Path to the file
 * @returns File content
 */
function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read file ${filePath}: ${errorMessage}`);
  }
}

/**
 * Find files matching a pattern
 * @param pattern - Glob pattern
 * @returns Array of file paths
 */
function findFiles(pattern: string): string[] {
  try {
    return glob.sync(pattern);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to find files matching pattern ${pattern}: ${errorMessage}`
    );
  }
}

/**
 * Check if a file exists
 * @param filePath - Path to the file
 * @returns True if file exists
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export { readFile, findFiles, fileExists };
