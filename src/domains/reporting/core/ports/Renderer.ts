import { Result } from '../../../../shared/types/Result';
import { Report } from '../entities/Report';

/**
 * Interface for report renderers
 */
export interface Renderer {
  /**
   * Renders a report to string format
   */
  render(report: Report): Promise<Result<string, Error>>;

  /**
   * Gets the output format this renderer handles
   */
  getFormat(): string;

  /**
   * Checks if this renderer supports streaming
   */
  supportsStreaming(): boolean;
}

/**
 * Interface for streaming renderers
 */
export interface StreamingRenderer extends Renderer {
  /**
   * Renders a report in streaming mode
   */
  renderStream(
    report: Report,
    onChunk: (chunk: string) => Promise<void>
  ): Promise<Result<void, Error>>;
}

/**
 * Interface for file writer
 */
export interface FileWriter {
  /**
   * Writes content to a file
   */
  writeFile(
    path: string,
    content: string,
    options?: WriteOptions
  ): Promise<Result<void, Error>>;

  /**
   * Creates a write stream
   */
  createWriteStream(
    path: string,
    options?: WriteOptions
  ): Result<NodeJS.WritableStream, Error>;
}

/**
 * Options for writing files
 */
export interface WriteOptions {
  compress?: 'gzip' | 'deflate';
  compressionLevel?: number;
  encoding?: BufferEncoding;
}

/**
 * Interface for report service
 */
export interface ReportService {
  /**
   * Generates a report in the specified format
   */
  generateReport(report: Report): Promise<Result<string, Error>>;

  /**
   * Writes a report to a file
   */
  writeReport(report: Report, outputPath: string): Promise<Result<void, Error>>;

  /**
   * Lists available output formats
   */
  getAvailableFormats(): string[];
}
