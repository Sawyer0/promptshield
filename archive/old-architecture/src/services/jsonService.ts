/**
 * JSON Service
 * Shared business logic for JSON operations
 */

import { ScanConfig } from '../types/core/scanConfig';
import { JsonParseResult } from '../types/data/json';

export class JsonService {
  /**
   * Check if content is JSON-like
   */
  static isJsonLike(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    const trimmed = content.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
  }

  /**
   * Check if content is valid JSON
   */
  static isValidJson(content: string): boolean {
    try {
      this.validateContent(content);
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if content is valid NDJSON
   */
  static isValidNdjson(content: string): boolean {
    try {
      this.validateContent(content);
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
   * Parse JSON content
   */
  static parseJson(content: string): any {
    this.validateContent(content);
    return JSON.parse(content);
  }

  /**
   * Parse NDJSON content
   */
  static parseNdjson(content: string): any[] {
    this.validateContent(content);
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    return lines.map((line) => JSON.parse(line.trim()));
  }

  /**
   * Extract text fields from parsed data
   */
  static extractTextFields(data: any, config: ScanConfig): string[] {
    const textFields: string[] = [];
    const fieldsToScan = config.fieldsToScan || ['prompt', 'response'];

    if (Array.isArray(data)) {
      // Handle array of objects
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
      // Handle single object
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
   * Validate content before processing
   */
  private static validateContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }
  }
}
