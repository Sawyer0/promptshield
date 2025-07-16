/**
 * Scan-specific validation logic
 * Handles all validation for the scan command
 */

import { ScanOptions } from '../../validators/options';
import { ScanConfig } from '../../../types/core/scanConfig';
import {
  validateScanConfig,
  logValidationResults,
} from '../../../utils/configValidator';
import { handleCliError } from '../../../utils/errors';
import {
  validateInputFile,
  validateRulePackFile,
} from '../../validators/cliValidators/fileValidators';
import {
  validateScanOptionsWithErrorHandling,
  validateFailOnSeverity,
} from '../../validators/cliValidators/optionValidators';
import {
  parseScanConfig,
  getRulePackPath,
} from '../../utils/optionParsers/scanOptionParser';

/**
 * Validates all scan command inputs and options
 * @param input - The input file path
 * @param options - The scan options
 */
export function validateScanCommand(
  input: string,
  options: ScanOptions
): {
  rulepackPath: string;
  failSeverity: string | undefined;
  scanConfig: ScanConfig;
} {
  // Validate all scan options
  validateScanOptionsWithErrorHandling(options, 'scan');

  // Validate input file
  validateInputFile(input, options.ndjson, 'scan');

  // Validate RulePack file
  const rulepackPath = getRulePackPath(options);
  validateRulePackFile(rulepackPath, 'scan');

  // Validate fail-on severity
  const failSeverity = validateFailOnSeverity(options.failOn, 'scan');

  // Parse and validate scan configuration
  const scanConfig = parseScanConfig(options, input);
  const configValidation = validateScanConfig(scanConfig);
  logValidationResults(configValidation, 'Scan config');
  if (!configValidation.isValid) {
    handleCliError(
      new Error(
        'Invalid scan configuration. Please check your scan options or see the documentation at https://github.com/promptshield/promptshield-clean#scan-config'
      ),
      'scan'
    );
  }

  return {
    rulepackPath,
    failSeverity,
    scanConfig,
  };
}
