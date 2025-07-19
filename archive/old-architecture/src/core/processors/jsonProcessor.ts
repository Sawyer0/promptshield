/**
 * JSON Processor
 * Single responsibility: Process JSON content with streaming and memory optimization
 */

import { Processor } from '../../types/modules/processor';
import { ScanConfig } from '../../types/core/scanConfig';
import { JsonParseResult } from '../../types/data/json';
import { createReadStream } from 'fs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { isJsonObject } from '../../types/data/json';
import { logger } from '../../utils/logger';
import {
  memoryMonitor as globalMemoryMonitor,
  MemoryMonitor,
} from '../../utils/memoryMonitor';

const DEBUG_PROGRESS_INTERVAL = 1000;

export class JsonProcessor implements Processor {
  /**
   * Process JSON content with streaming for large files
   */
  async process(content: string, config: ScanConfig): Promise<any> {
    // Use the existing working JSON parsing logic
    const result = JsonProcessor.parse(content, 'unknown');

    if (result.error) {
      throw new Error(result.error);
    }

    // Check if we should use streaming for large arrays
    if (
      Array.isArray(result.data) &&
      this.shouldUseStreaming(result.data.length, config)
    ) {
      return this.processWithStreaming(content, config);
    }

    return {
      type: 'json',
      data: result.data,
      textFields: this.extractTextFields(result.data, config),
      metadata: {
        processor: this.getName(),
        objectCount: Array.isArray(result.data) ? result.data.length : 1,
        streaming: false,
      },
    };
  }

  /**
   * Process large JSON arrays with streaming
   */
  private async processWithStreaming(
    content: string,
    config: ScanConfig
  ): Promise<any> {
    const memoryMonitor =
      config.memoryWarningThreshold !== undefined
        ? new MemoryMonitor({ warningThreshold: config.memoryWarningThreshold })
        : globalMemoryMonitor;

    const textFields: string[] = [];
    let objectCount = 0;
    const maxObjects = config.maxObjects || Infinity;
    const fieldsToScan = config.fieldsToScan || ['prompt', 'response'];

    // Process content as stream
    const lines = content.split('\n');
    for (const line of lines) {
      if (objectCount >= maxObjects) break;

      try {
        const obj = JSON.parse(line.trim());
        if (isJsonObject(obj)) {
          for (const field of fieldsToScan) {
            const value = obj[field];
            if (typeof value === 'string' && value.trim().length > 0) {
              textFields.push(value);
            }
          }
          objectCount++;
        }
      } catch (error) {
        // Skip malformed lines
        logger.debug(`Skipping malformed JSON line: ${line.slice(0, 100)}`);
      }

      if (objectCount > 0 && objectCount % DEBUG_PROGRESS_INTERVAL === 0) {
        memoryMonitor.checkMemoryUsage('JSON streaming');
      }
    }

    return {
      type: 'json',
      data: [], // Don't store full data in memory for streaming
      textFields,
      metadata: {
        processor: this.getName(),
        objectCount,
        streaming: true,
      },
    };
  }

  /**
   * Get processor name
   */
  getName(): string {
    return 'json';
  }

  /**
   * Check if content is JSON
   */
  supports(content: string): boolean {
    return JsonProcessor.isJsonLike(content);
  }

  /**
   * Extract text fields from parsed data (migrated from existing logic)
   */
  private extractTextFields(data: any, config: ScanConfig): string[] {
    const textFields: string[] = [];
    const fieldsToScan = config.fieldsToScan || ['prompt', 'response'];

    if (Array.isArray(data)) {
      for (const obj of data) {
        if (typeof obj === 'object' && obj !== null) {
          for (const field of fieldsToScan) {
            const value = obj[field];
            if (typeof value === 'string' && value.trim().length > 0) {
              textFields.push(value);
            }
          }
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      for (const field of fieldsToScan) {
        const value = data[field];
        if (typeof value === 'string' && value.trim().length > 0) {
          textFields.push(value);
        }
      }
    }

    return textFields;
  }

  /**
   * Determines if streaming should be used based on size and configuration
   */
  private shouldUseStreaming(arrayLength: number, config: ScanConfig): boolean {
    const streamingThreshold = config.streamingThreshold ?? 1000;
    return config.maxObjects !== undefined || arrayLength > streamingThreshold;
  }

  // Migrated static methods from existing JsonProcessor
  static parse(data: string, filePath: string): JsonParseResult {
    if (!data || data.trim().length === 0) {
      return {
        data: [],
        error: `File is empty: ${filePath}`,
      };
    }

    try {
      const parsed = JSON.parse(data);
      return { data: parsed };
    } catch (error) {
      return {
        data: [],
        error: `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  static isJsonLike(str: string): boolean {
    const trimmed = str.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }
}
