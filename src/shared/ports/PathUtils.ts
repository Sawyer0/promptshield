/**
 * Port for path manipulation utilities
 * Allows domain services to be platform-agnostic
 */
export interface IPathUtils {
  /**
   * Get the file extension
   */
  extname(filePath: string): string;

  /**
   * Get the base name of the file
   */
  basename(filePath: string): string;

  /**
   * Get the directory name
   */
  dirname(filePath: string): string;

  /**
   * Join path segments
   */
  join(...paths: string[]): string;
}
