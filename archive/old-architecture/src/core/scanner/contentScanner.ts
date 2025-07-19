/**
 * Content Scanner
 * Single responsibility: Apply rules to content using appropriate processor
 */

import { ScanResult } from '../../types/core/result';
import { ScanConfig } from '../../types/core/scanConfig';
import { Rule } from '../../types/core/rule';
import { Processor } from '../../types/modules/processor';

export class ContentScanner {
  /**
   * Scan content with rules using specified processor
   */
  async scanContent(
    content: string,
    rules: Rule[],
    processor: Processor,
    config: ScanConfig
  ): Promise<ScanResult[]> {
    // Step 1: Process content with processor
    const processedContent = await processor.process(content, config);

    // Step 2: Apply rules to processed content
    const violations = await this.applyRules(processedContent, rules, config);

    // Step 3: Format results
    return this.formatResults(violations, config);
  }

  /**
   * Apply rules to processed content
   */
  private async applyRules(
    content: any,
    rules: Rule[],
    config: ScanConfig
  ): Promise<any[]> {
    // Will be implemented when we migrate rule engine
    throw new Error('Rule application not yet migrated');
  }

  /**
   * Format violations into scan results
   */
  private formatResults(violations: any[], config: ScanConfig): ScanResult[] {
    // Will be implemented when we migrate result formatting
    throw new Error('Result formatting not yet migrated');
  }
}

export const contentScanner = new ContentScanner();
