/**
 * NDJSON Processor
 * Single responsibility: Process newline-delimited JSON content into structured data
 */

import { Processor } from '../../types/modules/processor';
import { ScanConfig } from '../../types/core/scanConfig';

export class NdjsonProcessor implements Processor {
  /**
   * Process NDJSON content
   */
  async process(content: string, config: ScanConfig): Promise<any> {
    // Parse NDJSON content line by line
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const parsedData = lines.map((line) => JSON.parse(line.trim()));

    // Extract text fields from all objects
    const textFields = parsedData.flatMap((obj) =>
      this.extractTextFields(obj, config)
    );

    return {
      type: 'ndjson',
      data: parsedData,
      textFields,
      metadata: {
        processor: this.getName(),
        objectCount: parsedData.length,
        textFieldCount: textFields.length,
      },
    };
  }

  /**
   * Get processor name
   */
  getName(): string {
    return 'ndjson';
  }

  /**
   * Check if content is NDJSON
   */
  supports(content: string): boolean {
    try {
      const lines = content
        .split('\n')
        .filter((line) => line.trim().length > 0);
      for (const line of lines) {
        JSON.parse(line.trim());
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract text fields from parsed data
   */
  private extractTextFields(data: any, config: ScanConfig): string[] {
    const textFields: string[] = [];
    const fieldsToScan = config.fieldsToScan || ['prompt', 'response'];

    if (typeof data === 'object' && data !== null) {
      for (const field of fieldsToScan) {
        const value = data[field];
        if (typeof value === 'string' && value.trim().length > 0) {
          textFields.push(value);
        }
      }
    }

    return textFields;
  }
}
