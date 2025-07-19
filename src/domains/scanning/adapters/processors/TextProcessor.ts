import {
  ContentProcessor,
  ProcessedContent,
} from '../../core/ports/ContentProcessor';
import { Result, ok, err } from '../../../../shared/types/Result';
import { ScanContext } from '../../core/entities/ScanContext';

/**
 * Processes plain text content
 */
export class TextProcessor implements ContentProcessor {
  /**
   * Checks if this processor can handle the given file type
   */
  canProcess(filePath: string): boolean {
    const extensions = this.getSupportedExtensions();
    return extensions.some((ext) => filePath.toLowerCase().endsWith(ext));
  }

  /**
   * Gets the supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.txt', '.text', '.log', '.md'];
  }

  /**
   * Processes text content and returns structured data
   */
  async process(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>> {
    try {
      const maxObjects = context.getMaxObjects();

      // For text files, treat the entire content as one object
      const results: ProcessedContent[] = [
        {
          data: content,
          fields: {
            content: content,
          },
          metadata: {
            index: 0,
            source: 'text',
            type: 'text',
          },
        },
      ];

      // If maxObjects is set to 0, return empty array
      if (maxObjects === 0) {
        return ok([]);
      }

      return ok(results);
    } catch (error) {
      return err(new Error(`Failed to process text content: ${error}`));
    }
  }

  /**
   * Splits text into chunks if needed (for large text files)
   */
  private splitIntoChunks(
    content: string,
    chunkSize: number = 10000
  ): string[] {
    const chunks: string[] = [];
    const lines = content.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (
        currentChunk.length + line.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Process text with chunking for large files
   */
  async processWithChunking(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>> {
    try {
      const maxObjects = context.getMaxObjects();
      const chunks = this.splitIntoChunks(content);
      const results: ProcessedContent[] = [];

      for (let i = 0; i < chunks.length; i++) {
        if (maxObjects && i >= maxObjects) break;

        results.push({
          data: chunks[i],
          fields: {
            content: chunks[i],
          },
          metadata: {
            index: i,
            source: 'text-chunk',
            type: 'text',
          },
        });
      }

      return ok(results);
    } catch (error) {
      return err(new Error(`Failed to process text with chunking: ${error}`));
    }
  }
}
