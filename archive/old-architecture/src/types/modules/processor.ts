/**
 * Processor module types
 */

import { ScanConfig } from '../core/scanConfig';

export interface Processor {
  /**
   * Process content and return structured data
   */
  process(content: string, config: ScanConfig): Promise<any>;

  /**
   * Get processor name/type
   */
  getName(): string;

  /**
   * Check if processor supports given content
   */
  supports(content: string): boolean;
}

export type FileType = 'json' | 'ndjson' | 'text' | 'directory' | 'unknown';
