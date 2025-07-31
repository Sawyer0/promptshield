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
  canProcess(filePath: string): boolean {
    const extensions = this.getSupportedExtensions();
    return extensions.some((ext) => filePath.toLowerCase().endsWith(ext));
  }

  getSupportedExtensions(): string[] {
    return ['.txt', '.text', '.log', '.md'];
  }

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

      if (maxObjects === 0) {
        return ok([]);
      }

      return ok(results);
    } catch (error) {
      return err(new Error(`Failed to process text content: ${error}`));
    }
  }

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
