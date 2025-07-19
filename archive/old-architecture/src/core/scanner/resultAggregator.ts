/**
 * Result Aggregator
 * Single responsibility: Aggregate and format scan results
 */

import { ScanResult } from '../../types/core/result';
import { ScanConfig } from '../../types/core/scanConfig';

export class ResultAggregator {
  /**
   * Aggregate scan results with proper formatting
   */
  aggregateResults(
    scanResults: ScanResult[],
    config: ScanConfig
  ): ScanResult[] {
    // Step 1: Filter results based on config
    const filteredResults = this.filterResults(scanResults, config);

    // Step 2: Sort results by severity
    const sortedResults = this.sortResults(filteredResults);

    // Step 3: Apply limits if specified
    return this.applyLimits(sortedResults, config);
  }

  /**
   * Filter results based on configuration
   */
  private filterResults(
    results: ScanResult[],
    config: ScanConfig
  ): ScanResult[] {
    // Will be implemented when we migrate filtering logic
    return results;
  }

  /**
   * Sort results by severity
   */
  private sortResults(results: ScanResult[]): ScanResult[] {
    // Will be implemented when we migrate sorting logic
    return results;
  }

  /**
   * Apply limits to results
   */
  private applyLimits(results: ScanResult[], config: ScanConfig): ScanResult[] {
    // Will be implemented when we migrate limit logic
    return results;
  }
}

export const resultAggregator = new ResultAggregator();
