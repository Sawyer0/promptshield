import { Result } from '../../../../shared/types/Result';
import { ScanContext } from '../entities/ScanContext';

/**
 * Interface for processing different types of content
 */
export interface ContentProcessor {
  canProcess(filePath: string): boolean;

  process(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>>;

  getSupportedExtensions(): string[];
}

export interface ProcessedContent {
  /**
   * The original object or content
   */
  data: unknown;

  fields: Record<string, string>;

  metadata: {
    index: number;
    source: string;
    type: string;
  };
}

export interface StreamingProcessor extends ContentProcessor {
  processStream(
    content: string,
    context: ScanContext,
    onItem: (item: ProcessedContent) => Promise<void>
  ): Promise<Result<void, Error>>;
}
