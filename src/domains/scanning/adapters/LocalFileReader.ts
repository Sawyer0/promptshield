import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FileReader, FileMetadata } from '../core/ports/FileReader';
import { Result, ok, err } from '../../../shared/types/Result';

/**
 * Local file system implementation of FileReader
 */
export class LocalFileReader implements FileReader {
  /**
   * Reads a file and returns its content
   */
  async readFile(filePath: string): Promise<Result<string, Error>> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return ok(content);
    } catch (error) {
      return err(new Error(`Failed to read file ${filePath}: ${error}`));
    }
  }

  /**
   * Checks if a file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a path is a directory
   */
  async isDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Lists files in a directory
   */
  async listFiles(
    dirPath: string,
    pattern?: string
  ): Promise<Result<string[], Error>> {
    try {
      if (!(await this.isDirectory(dirPath))) {
        return err(new Error(`${dirPath} is not a directory`));
      }

      const searchPattern = pattern || '**/*.{json,ndjson,jsonl,txt}';
      const files = await glob(searchPattern, {
        cwd: dirPath,
        absolute: true,
        nodir: true,
      });

      return ok(files);
    } catch (error) {
      return err(new Error(`Failed to list files in ${dirPath}: ${error}`));
    }
  }

  /**
   * Gets file size in bytes
   */
  async getFileSize(filePath: string): Promise<Result<number, Error>> {
    try {
      const stats = await fs.promises.stat(filePath);
      return ok(stats.size);
    } catch (error) {
      return err(
        new Error(`Failed to get file size for ${filePath}: ${error}`)
      );
    }
  }

  /**
   * Gets file metadata
   */
  async getFileMetadata(
    filePath: string
  ): Promise<Result<FileMetadata, Error>> {
    try {
      const stats = await fs.promises.stat(filePath);
      const extension = path.extname(filePath).toLowerCase();

      let type: 'json' | 'ndjson' | 'txt' | 'unknown' = 'unknown';
      if (extension === '.json') type = 'json';
      else if (extension === '.ndjson' || extension === '.jsonl')
        type = 'ndjson';
      else if (extension === '.txt') type = 'txt';

      return ok({
        path: filePath,
        size: stats.size,
        extension,
        type,
      });
    } catch (error) {
      return err(new Error(`Failed to get metadata for ${filePath}: ${error}`));
    }
  }

  /**
   * Determines if a file should be treated as NDJSON
   */
  isNdjsonFile(filePath: string, ndjsonFlag?: boolean): boolean {
    return (
      ndjsonFlag || filePath.endsWith('.ndjson') || filePath.endsWith('.jsonl')
    );
  }

  /**
   * Creates a read stream for a file
   */
  createReadStream(filePath: string): fs.ReadStream {
    return fs.createReadStream(filePath, { encoding: 'utf-8' });
  }
}
