import {
  ContentProcessor,
  ProcessedContent,
  StreamingProcessor,
} from '../../core/ports/ContentProcessor';
import { Result, ok, err } from '../../../../shared/types/Result';
import { ScanContext } from '../../core/entities/ScanContext';
import * as StreamJson from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

/**
 * Processes JSON and NDJSON content
 */
export class JsonProcessor implements ContentProcessor, StreamingProcessor {
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
    return ['.json', '.ndjson', '.jsonl'];
  }

  /**
   * Processes JSON content and returns structured data
   */
  async process(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>> {
    try {
      const isNdjson = context.isNdjsonMode();

      if (isNdjson) {
        return this.processNdjson(content, context);
      } else {
        return this.processRegularJson(content, context);
      }
    } catch (error) {
      return err(new Error(`Failed to process JSON content: ${error}`));
    }
  }

  /**
   * Processes regular JSON (array or single object)
   */
  private async processRegularJson(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>> {
    try {
      const data = JSON.parse(content);

      // Handle both arrays and single objects
      const items = Array.isArray(data) ? data : [data];

      const results: ProcessedContent[] = [];
      const maxObjects = context.getMaxObjects();
      const fieldsToScan = context.getFieldsToScan();

      for (let i = 0; i < items.length; i++) {
        if (maxObjects && i >= maxObjects) break;

        const item = items[i];
        const fields: Record<string, string> = {};

        // Extract specified fields
        for (const field of fieldsToScan) {
          if (item[field] !== undefined) {
            fields[field] = String(item[field]);
          }
        }

        // Optionally scan entire object
        if (context.shouldScanEntireObject()) {
          fields['_entire_object'] = JSON.stringify(item);
        }

        results.push({
          data: item,
          fields,
          metadata: {
            index: i,
            source: 'json',
            type: 'object',
          },
        });
      }

      return ok(results);
    } catch (error) {
      return err(new Error(`Failed to parse JSON: ${error}`));
    }
  }

  /**
   * Processes NDJSON (newline-delimited JSON)
   */
  private async processNdjson(
    content: string,
    context: ScanContext
  ): Promise<Result<ProcessedContent[], Error>> {
    try {
      const lines = content.split('\n').filter((line) => line.trim());
      const results: ProcessedContent[] = [];
      const maxObjects = context.getMaxObjects();
      const fieldsToScan = context.getFieldsToScan();

      for (let i = 0; i < lines.length; i++) {
        if (maxObjects && i >= maxObjects) break;

        const line = lines[i].trim();
        if (!line) continue;

        try {
          const item = JSON.parse(line);
          const fields: Record<string, string> = {};

          // Extract specified fields
          for (const field of fieldsToScan) {
            if (item[field] !== undefined) {
              fields[field] = String(item[field]);
            }
          }

          // Optionally scan entire object
          if (context.shouldScanEntireObject()) {
            fields['_entire_object'] = JSON.stringify(item);
          }

          results.push({
            data: item,
            fields,
            metadata: {
              index: i,
              source: 'ndjson',
              type: 'object',
            },
          });
        } catch (parseError) {
          // Skip malformed lines
          if (context.config.debug) {
            console.error(`Failed to parse line ${i + 1}: ${parseError}`);
          }
        }
      }

      return ok(results);
    } catch (error) {
      return err(new Error(`Failed to process NDJSON: ${error}`));
    }
  }

  /**
   * Processes content in streaming mode for large files
   */
  async processStream(
    content: string,
    context: ScanContext,
    onItem: (item: ProcessedContent) => Promise<void>
  ): Promise<Result<void, Error>> {
    try {
      const isNdjson = context.isNdjsonMode();

      if (isNdjson) {
        return this.processNdjsonStream(content, context, onItem);
      } else {
        return this.processJsonStream(content, context, onItem);
      }
    } catch (error) {
      return err(new Error(`Failed to process stream: ${error}`));
    }
  }

  /**
   * Processes JSON array in streaming mode
   */
  private async processJsonStream(
    content: string,
    context: ScanContext,
    onItem: (item: ProcessedContent) => Promise<void>
  ): Promise<Result<void, Error>> {
    return new Promise((resolve) => {
      try {
        const fieldsToScan = context.getFieldsToScan();
        const maxObjects = context.getMaxObjects();
        let processedCount = 0;

        const pipeline = StreamJson.parser().pipe(streamArray());

        pipeline.on('data', async ({ value }) => {
          if (maxObjects && processedCount >= maxObjects) {
            pipeline.destroy();
            return;
          }

          const fields: Record<string, string> = {};

          // Extract specified fields
          for (const field of fieldsToScan) {
            if (value[field] !== undefined) {
              fields[field] = String(value[field]);
            }
          }

          // Optionally scan entire object
          if (context.shouldScanEntireObject()) {
            fields['_entire_object'] = JSON.stringify(value);
          }

          await onItem({
            data: value,
            fields,
            metadata: {
              index: processedCount,
              source: 'json-stream',
              type: 'object',
            },
          });

          processedCount++;
        });

        pipeline.on('end', () => resolve(ok(undefined)));
        pipeline.on('error', (error) =>
          resolve(err(new Error(`Stream error: ${error}`)))
        );

        // Write content to pipeline
        pipeline.write(content);
        pipeline.end();
      } catch (error) {
        resolve(err(new Error(`Failed to create stream: ${error}`)));
      }
    });
  }

  /**
   * Processes NDJSON in streaming mode
   */
  private async processNdjsonStream(
    content: string,
    context: ScanContext,
    onItem: (item: ProcessedContent) => Promise<void>
  ): Promise<Result<void, Error>> {
    try {
      const lines = content.split('\n');
      const fieldsToScan = context.getFieldsToScan();
      const maxObjects = context.getMaxObjects();
      let processedCount = 0;

      for (const line of lines) {
        if (maxObjects && processedCount >= maxObjects) break;

        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        try {
          const value = JSON.parse(trimmedLine);
          const fields: Record<string, string> = {};

          // Extract specified fields
          for (const field of fieldsToScan) {
            if (value[field] !== undefined) {
              fields[field] = String(value[field]);
            }
          }

          // Optionally scan entire object
          if (context.shouldScanEntireObject()) {
            fields['_entire_object'] = JSON.stringify(value);
          }

          await onItem({
            data: value,
            fields,
            metadata: {
              index: processedCount,
              source: 'ndjson-stream',
              type: 'object',
            },
          });

          processedCount++;
        } catch (parseError) {
          // Skip malformed lines
          if (context.config.debug) {
            console.error(`Failed to parse line: ${parseError}`);
          }
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to process NDJSON stream: ${error}`));
    }
  }

  /**
   * Determines if streaming should be used based on content size
   */
  shouldUseStreaming(contentSize: number, threshold: number): boolean {
    return contentSize > threshold * 1024 * 1024; // Convert MB to bytes
  }
}
