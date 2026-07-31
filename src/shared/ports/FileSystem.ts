import { Result } from '../types/Result';

/**
 * Port for file system operations
 * Allows domain services to be platform-agnostic
 */
export interface IFileSystem {
  /**
   * Check if a path exists asynchronously
   */
  exists(path: string): Promise<boolean>;

  /**
   * Check if a path exists synchronously
   */
  existsSync(path: string): boolean;

  /**
   * Read file contents as a string
   */
  readFile(path: string): Promise<Result<string, Error>>;

  /**
   * Write content to a file
   */
  writeFile(path: string, content: string): Promise<Result<void, Error>>;

  /**
   * Create a directory
   */
  mkdir(path: string, recursive: boolean): Promise<Result<void, Error>>;
}
