/**
 * Result processing logic for scan command
 * Handles filtering, pagination, truncation, and summary generation
 */

import { ScanResult } from '../../../types/core/rule';
import { ScanOptions } from '../../validators/options';
import { Severity } from '../../../types/core/severity';
import {
  filterViolations,
  applyPagination,
  truncateResults,
  shouldFailOnSeverity,
  getResultSummary,
} from '../../utils/optionParsers/resultProcessor';
import { logger } from '../../../utils/logger';
import { getSuggestions, formatSuggestions } from '../../../utils/suggestions';

/**
 * Processes scan results with filtering, pagination, and truncation
 * @param results - Raw scan results
 * @param options - Scan options for filtering and pagination
 * @returns Processed scan results
 */
export function processScanResults(
  results: ScanResult[],
  options: ScanOptions
): ScanResult[] {
  // Process results
  let filteredResults = filterViolations(
    results,
    options.severity,
    options.category
  );
  filteredResults = applyPagination(
    filteredResults,
    options.offset,
    options.limit
  );
  filteredResults = truncateResults(filteredResults, options.maxViolations);

  return filteredResults;
}

/**
 * Checks if scan should fail based on severity threshold
 * @param results - The scan results to check
 * @param failSeverity - The severity level that should cause failure
 * @returns True if scan should fail
 */
export function checkFailOnSeverity(
  results: ScanResult[],
  failSeverity: string | undefined
): boolean {
  if (!failSeverity) return false;

  if (shouldFailOnSeverity(results, failSeverity as Severity)) {
    logger.error(`Scan failed due to ${failSeverity} severity violation.`);
    return true;
  }

  return false;
}

/**
 * Logs scan summary based on results
 * @param results - The scan results
 * @param quiet - Whether to suppress output
 * @param verbose - Whether to show detailed information
 * @param suggest - Whether to show remediation suggestions
 */
export function logScanSummary(
  results: ScanResult[],
  quiet?: boolean,
  verbose?: boolean,
  suggest?: boolean,
  cleanOutput?: boolean
): void {
  if (quiet) return;

  const summary = getResultSummary(results);

  if (!summary.hasViolations) {
    logger.success(
      cleanOutput ? 'No violations found' : '✅ No violations found'
    );
    return;
  }

  // Group violations by severity
  const severityGroups: Record<
    string,
    Array<{
      result: ScanResult;
      violation: {
        ruleId: string;
        severity: string;
        category?: string;
        message?: string;
        lineNumber?: number;
      };
    }>
  > = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const result of results) {
    for (const violation of result.violations) {
      if (!severityGroups[violation.severity]) {
        severityGroups[violation.severity] = [];
      }
      severityGroups[violation.severity].push({ result, violation });
    }
  }

  // Show summary header
  logger.warn(
    cleanOutput
      ? `${summary.totalViolations} Issues Found:`
      : `🔥 ${summary.totalViolations} Issues Found:`
  );

  // Show severity breakdown
  for (const [severity, violations] of Object.entries(severityGroups)) {
    if (violations.length > 0) {
      const severityUpper = severity.toUpperCase();
      logger.warn(`  - ${violations.length} ${severityUpper}`);
    }
  }

  // Show individual violations grouped by severity
  for (const [severity, violations] of Object.entries(severityGroups)) {
    if (violations.length > 0) {
      for (const { result, violation } of violations) {
        const emoji =
          severity === 'critical' || severity === 'high' ? '❌' : '⚠️';
        const severityText =
          severity === 'critical' || severity === 'high'
            ? 'Policy violation'
            : `${severity.toUpperCase()} detected`;
        const location = violation.lineNumber ? `:${violation.lineNumber}` : '';
        const fileLink = `${result.file}${location}`;

        let message = cleanOutput
          ? `${severityText} in ${fileLink}`
          : `${emoji} ${severityText} in ${fileLink}`;

        // Add verbose details
        if (verbose) {
          message += ` [${violation.ruleId}]`;
          if (violation.category) {
            message += ` (${violation.category})`;
          }
          if (violation.message && violation.message !== violation.ruleId) {
            message += ` - ${violation.message}`;
          }
        }

        logger.warn(message);
      }
    }
  }

  // Show suggestions if enabled
  if (suggest) {
    const allViolations = results.flatMap((r) => r.violations);
    const suggestions = getSuggestions(allViolations);
    const suggestionLines = formatSuggestions(suggestions);

    if (suggestionLines.length > 0) {
      logger.info(''); // Empty line for separation
      for (const line of suggestionLines) {
        logger.info(line);
      }
    }
  }

  // Log final summary
  const fileText = summary.totalFiles === 1 ? 'file' : 'files';
  logger.success(
    cleanOutput
      ? `${summary.totalFiles} ${fileText} scanned, ${summary.totalViolations} issues found`
      : `✅ ${summary.totalFiles} ${fileText} scanned, ${summary.totalViolations} issues found`
  );
}
