/**
 * Output handling logic for scan command
 * Handles output formatting and writing for scan results
 */

import { ScanResult } from '../../../types/core/rule';
import { ScanOptions } from '../../validators/options';
import { OutputHandler } from '../../output/outputHandler';
import { parseOutputOptions } from '../../utils/optionParsers/scanOptionParser';

/**
 * Handles output of scan results
 * @param results - The scan results to output
 * @param options - The scan options for output configuration
 */
export async function handleScanOutput(
  results: ScanResult[],
  options: ScanOptions
): Promise<void> {
  // Parse output options
  const outputOptions = parseOutputOptions(options);

  // Create output handler and output results
  const outputHandler = new OutputHandler(outputOptions);
  await outputHandler.outputResults(results);
}
