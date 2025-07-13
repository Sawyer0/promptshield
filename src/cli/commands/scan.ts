/**
 * Scan command implementation for PromptShield CLI
 */

import chalk from 'chalk';
import fs from 'fs';
import { applyRulesToDataOrStream } from '../../core/scanner';
import { ScanResult, Violation } from '../../types/core/rule';
import { Severity } from '../../types/core/severity';
import {
  formatErrorForCLI,
  getExitCode,
  PromptShieldError,
} from '../../utils/errors';
import { ScanConfig } from '../../types/core/scanConfig';
import {
  ScanOptions,
  validateFileFormat,
  validateRulepack,
  validateSeverity,
} from '../validators/options';
import { formatMarkdown } from '../formatters/markdown';

const { yellow, green, red } = chalk;

const severityWeight: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Executes the scan command
 */
export async function executeScanCommand(
  input: string,
  options: ScanOptions
): Promise<void> {
  // Validate file format
  const isNdjsonMode = options.ndjson || !!input.match(/\.(ndjson|jsonl)$/);
  const isValidFormat = validateFileFormat(input, options.ndjson);

  if (!isValidFormat) {
    console.error(
      yellow('Unsupported file format. Try: .json, .ndjson, or .jsonl input')
    );
    process.exit(1);
  }

  const failSeverity = options.failOn as Severity;
  const rulepackPath: string = options.rulepack || 'rulepacks/pii.yaml';

  if (!validateRulepack(rulepackPath)) {
    console.error(yellow(`RulePack file not found: ${rulepackPath}`));
    process.exit(1);
  }

  if (failSeverity && !validateSeverity(failSeverity)) {
    console.error(
      yellow(
        `Invalid severity level: ${failSeverity}. Use: low, medium, high, critical`
      )
    );
    process.exit(1);
  }

  try {
    // Parse scan configuration
    const scanConfig: ScanConfig = {
      fieldsToScan: options.fields
        ? options.fields.split(',').map((f) => f.trim())
        : undefined,
      scanEntireObject: options.scanEntireObject,
      debug: options.debug,
      maxObjects: options.maxObjects
        ? parseInt(options.maxObjects, 10)
        : undefined,
      ndjsonMode: isNdjsonMode,
      schemaName: options.schema,
      compression: options.compress
        ? {
            type: options.compress as 'gzip' | 'deflate',
            level: options.compressionLevel
              ? parseInt(options.compressionLevel, 10)
              : 6,
          }
        : undefined,
    };

    const results: ScanResult[] = await applyRulesToDataOrStream(
      input,
      rulepackPath,
      false,
      options.debug,
      scanConfig
    );

    if (failSeverity) {
      const shouldFail = results.some((result) =>
        result.violations.some(
          (v: Violation) =>
            severityWeight[v.severity as Severity] >=
            severityWeight[failSeverity]
        )
      );
      if (shouldFail) {
        console.error(
          yellow(`Scan failed due to ${failSeverity} severity violation.`)
        );
        process.exit(1);
      }
    }

    let reportContent: string = '';
    if (options.output === 'json') {
      reportContent = JSON.stringify(results, null, 2);
    } else {
      reportContent = formatMarkdown(results);
    }

    if (options.outputFile) {
      await fs.promises.writeFile(options.outputFile, reportContent);
      console.log(green(`✅ Report saved to ${options.outputFile}`));
    } else {
      console.log(reportContent);
    }
  } catch (err: unknown) {
    if (err instanceof PromptShieldError) {
      console.error(red(formatErrorForCLI(err)));
      process.exit(getExitCode(err));
    } else if (err instanceof Error) {
      console.error(red(`Error during scan: ${err.message}`));
      process.exit(1);
    } else {
      console.error(red('Unknown error during scan'));
      process.exit(1);
    }
  }
}
