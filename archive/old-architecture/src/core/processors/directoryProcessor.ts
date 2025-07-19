/**
 * Directory Processor
 * Single responsibility: Process directory content into structured data
 */

import { Processor } from '../../types/modules/processor';
import { ScanConfig } from '../../types/core/scanConfig';
import { FileService } from '../../services/fileService';

export class DirectoryProcessor implements Processor {
  /**
   * Process directory content
   */
  async process(content: string, config: ScanConfig): Promise<any> {
    // Directory content should be a path
    const directoryPath = content.trim();

    // Get all files in directory
    const files = await FileService.getFilesInDirectory(directoryPath, config);

    // Process each file
    const processedFiles = await Promise.all(
      files.map(async (filePath) => {
        const fileContent = await FileService.readFile(filePath);
        return {
          path: filePath,
          content: fileContent,
          size: fileContent.length,
        };
      })
    );

    return {
      type: 'directory',
      data: {
        path: directoryPath,
        files: processedFiles,
      },
      textFields: processedFiles.map((file) => file.content),
      metadata: {
        processor: this.getName(),
        fileCount: processedFiles.length,
        totalSize: processedFiles.reduce((sum, file) => sum + file.size, 0),
      },
    };
  }

  /**
   * Get processor name
   */
  getName(): string {
    return 'directory';
  }

  /**
   * Check if content represents a directory
   */
  supports(content: string): boolean {
    // Simple check - could be enhanced
    return content.includes('/') || content.includes('\\');
  }
}
