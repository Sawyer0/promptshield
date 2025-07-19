/**
 * Text Processor
 * Single responsibility: Process plain text content into structured data
 */

import { Processor } from '../../types/modules/processor';
import { ScanConfig } from '../../types/core/scanConfig';

export class TextProcessor implements Processor {
  /**
   * Process text content
   */
  async process(content: string, config: ScanConfig): Promise<any> {
    // Split content into lines for processing
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    return {
      type: 'text',
      data: content,
      textFields: [content], // Treat entire content as one text field
      lines,
      metadata: {
        processor: this.getName(),
        lineCount: lines.length,
        characterCount: content.length,
        textFieldCount: 1,
      },
    };
  }

  /**
   * Get processor name
   */
  getName(): string {
    return 'text';
  }

  /**
   * Check if content is text (fallback processor)
   */
  supports(content: string): boolean {
    return true; // Text processor is the fallback for any content
  }
}
