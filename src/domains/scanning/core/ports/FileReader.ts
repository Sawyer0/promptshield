import { Result } from '../../../../shared/types/Result';

/**
 * Interface for reading files from various sources
 */
export interface FileReader {
  /**
   * Reads a file and returns its content
   */
  readFile(path: string): Promise<Result<string, Error>>;

  /**
   * Checks if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Checks if a path is a directory
   */
  isDirectory(path: string): Promise<boolean>;

  /**
   * Lists files in a directory
   */
  listFiles(path: string, pattern?: string): Promise<Result<string[], Error>>;

  /**
   * Gets file size in bytes
   */
  getFileSize(path: string): Promise<Result<number, Error>>;
}

/**
 * Interface for file metadata
 */
export interface FileMetadata {
  path: string;
  size: number;
  extension: string;
  type: 'json' | 'ndjson' | 'txt' | 'unknown';
}
