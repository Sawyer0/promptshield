import { Result } from '../../../../shared/types/Result';
import { ScanContext } from '../entities/ScanContext';

/**
 * Interface for processing different types of content
 */
export interface ContentProcessor {
  /**
   * Checks if this processor can handle the given file type
   */
  canProcess(filePath: string): boolean;

  /**
   * Processes the content and returns structured data
   */
  process(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>>;

  /**
   * Gets the supported file extensions
   */
  getSupportedExtensions(): string[];
}

/**
 * Represents processed content ready for scanning
 */
export interface ProcessedContent {
  /**
   * The original object or content
   */
  data: unknown;

  /**
   * Fields extracted for scanning
   */
  fields: Record<string, string>;

  /**
   * Metadata about the content
   */
  metadata: {
    index: number;
    source: string;
    type: string;
  };
}

/**
 * Interface for content streaming
 */
export interface StreamingProcessor extends ContentProcessor {
  /**
   * Processes content in streaming mode
   */
  processStream(
    content: string,
    context: ScanContext,
    onItem: (item: ProcessedContent) => Promise<void>
  ): Promise<Result<void, Error>>;
}
