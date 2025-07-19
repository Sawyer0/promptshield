/**
 * File Processor
 * Single responsibility: Detect file type and select appropriate processor
 */

import { ScanConfig } from '../../types/core/scanConfig';
import { Processor } from '../../types/modules/processor';
import { FileService } from '../../services/fileService';

export class FileProcessor {
  /**
   * Get appropriate processor based on content and config
   */
  getProcessor(content: string, config: ScanConfig): Processor {
    // Detect file type
    const fileType = FileService.detectFileType(content);

    // Select processor based on type
    switch (fileType) {
      case 'json':
        return this.getJsonProcessor();
      case 'ndjson':
        return this.getNdjsonProcessor();
      case 'text':
        return this.getTextProcessor();
      case 'directory':
        return this.getDirectoryProcessor();
      default:
        return this.getTextProcessor(); // fallback
    }
  }

  private getJsonProcessor(): Processor {
    // Will be implemented when we migrate processors
    throw new Error('JSON processor not yet migrated');
  }

  private getNdjsonProcessor(): Processor {
    // Will be implemented when we migrate processors
    throw new Error('NDJSON processor not yet migrated');
  }

  private getTextProcessor(): Processor {
    // Will be implemented when we migrate processors
    throw new Error('Text processor not yet migrated');
  }

  private getDirectoryProcessor(): Processor {
    // Will be implemented when we migrate processors
    throw new Error('Directory processor not yet migrated');
  }
}

export const fileProcessor = new FileProcessor();
