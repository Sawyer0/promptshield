/**
 * Main Scanner Entry Point
 * Single responsibility: Route scanning requests to appropriate processors
 */

import { ScanResult } from '../../types/core/result';
import { ScanConfig } from '../../types/core/scanConfig';
import { Rule } from '../../types/core/rule';
import { orchestrator } from './orchestrator';

/**
 * Main scanning function - single entry point for all scanning operations
 * @param filePathOrData - File path or raw data string
 * @param rules - Array of rules to apply
 * @param config - Scan configuration options
 * @returns Promise resolving to scan results
 */
export async function scanContent(
  filePathOrData: string,
  rules: Rule[],
  config: ScanConfig = {}
): Promise<ScanResult[]> {
  return orchestrator.scan(filePathOrData, rules, config);
}

/**
 * Legacy compatibility export
 */
export { orchestrator };
