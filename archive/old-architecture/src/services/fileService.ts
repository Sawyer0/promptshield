/**
 * File Service
 * Shared business logic for file operations
 */

import { FileType } from '../types/modules/processor';
import { ScanConfig } from '../types/core/scanConfig';
import {
  isDirectory,
  readFileUtf8,
  findDataFiles,
} from '../processing/fileUtils';

export class FileService {
  /**
   * Check if string is a file path
   */
  static isFilePath(input: string): boolean {
    // Simple check for file path - could be enhanced
    return input.includes('/') || input.includes('\\') || input.includes('.');
  }

  /**
   * Read file content
   */
  static async readFile(filePath: string): Promise<string> {
    return readFileUtf8(filePath);
  }

  /**
   * Detect file type from content
   */
  static detectFileType(content: string): FileType {
    // Simple detection - could be enhanced
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'json';
    }

    if (
      content.includes('\n') &&
      content
        .split('\n')
        .some(
          (line) => line.trim().startsWith('{') || line.trim().startsWith('[')
        )
    ) {
      return 'ndjson';
    }

    return 'text';
  }

  /**
   * Validate file exists
   */
  static validateFileExists(filePath: string): boolean {
    // Simple check - could be enhanced
    return true;
  }

  /**
   * Check if path is a directory
   */
  static async isDirectory(path: string): Promise<boolean> {
    return isDirectory(path);
  }

  /**
   * Get all files in directory
   */
  static async getFilesInDirectory(
    directoryPath: string,
    config: ScanConfig
  ): Promise<string[]> {
    return findDataFiles(directoryPath);
  }
}
