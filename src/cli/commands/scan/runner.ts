import { applyRulesToDataOrStream } from '../../../core/scanner';
import { ScanResult } from '../../../types/core/rule';
import { ScanOptions } from '../../validators/options';
import { logger } from '../../../utils/logger';
import { handleCliError } from '../../../utils/errors';
import { validateScanCommand } from './validation';
import {
  processScanResults,
  checkFailOnSeverity,
  logScanSummary,
} from './resultProcessing';
import { handleScanOutput } from './output';

export async function executeScanCommand(
  input: string,
  options: ScanOptions
): Promise<void> {
  try {
    // Validate all inputs and options
    const { rulepackPath, failSeverity, scanConfig } = validateScanCommand(
      input,
      options
    );

    if (!options.quiet) {
      logger.info('Scanning for violations...');
    }

    // Execute scan
    const results: ScanResult[] = await applyRulesToDataOrStream(
      input,
      rulepackPath,
      false,
      options.debug,
      scanConfig
    );

    // Process results
    const processedResults = processScanResults(results, options);

    // Check fail-on severity
    if (checkFailOnSeverity(processedResults, failSeverity)) {
      process.exit(1);
    }

    // Log summary BEFORE output (so it appears before JSON)
    logScanSummary(
      processedResults,
      options.quiet,
      options.verbose,
      options.suggest,
      !options.outputFile // cleanOutput: true if output is to CLI
    );

    // Output results
    await handleScanOutput(processedResults, options);
  } catch (err) {
    handleCliError(err, 'scan');
  }
}
