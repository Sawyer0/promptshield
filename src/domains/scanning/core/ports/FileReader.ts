import { Result } from '../../../../shared/types/Result';

/**
 * Interface for reading files from various sources
 */
export interface FileReader {
  readFile(path: string): Promise<Result<string, Error>>;

  exists(path: string): Promise<boolean>;

  isDirectory(path: string): Promise<boolean>;

  listFiles(path: string, pattern?: string): Promise<Result<string[], Error>>;

  getFileSize(path: string): Promise<Result<number, Error>>;
}

export interface FileMetadata {
  path: string;
  size: number;
  extension: string;
  type: 'json' | 'ndjson' | 'txt' | 'unknown';
}
