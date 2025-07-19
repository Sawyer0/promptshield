/**
 * Scanner Orchestrator
 * Single responsibility: Coordinate the scanning process
 */

import { ScanResult } from '../../types/core/result';
import { ScanConfig } from '../../types/core/scanConfig';
import { Rule } from '../../types/core/rule';
import { fileProcessor } from './fileProcessor';
import { contentScanner } from './contentScanner';
import { resultAggregator } from './resultAggregator';
import { FileService } from '../../services/fileService';

export class ScannerOrchestrator {
  /**
   * Main scanning orchestration
   */
  async scan(
    filePathOrData: string,
    rules: Rule[],
    config: ScanConfig = {}
  ): Promise<ScanResult[]> {
    // Step 1: Determine if input is file path or raw data
    const isData = !FileService.isFilePath(filePathOrData);

    // Step 2: Process file or data
    const content = isData
      ? filePathOrData
      : await FileService.readFile(filePathOrData);

    // Step 3: Detect file type and get appropriate processor
    const processor = fileProcessor.getProcessor(content, config);

    // Step 4: Scan content with rules
    const scanResults = await contentScanner.scanContent(
      content,
      rules,
      processor,
      config
    );

    // Step 5: Aggregate and format results
    return resultAggregator.aggregateResults(scanResults, config);
  }
}

export const orchestrator = new ScannerOrchestrator();
