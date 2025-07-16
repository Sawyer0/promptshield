/**
 * Shared file validation utilities for CLI commands
 * Provides consistent file validation across all commands
 */

import { existsSync } from 'fs';
import * as path from 'path';
import * as fs from 'fs';
import { validateFileFormat, validateRulepack } from '../options';
import { handleCliError } from '../../../utils/errors';

/**
 * Validates input file path and format
 * @param input - The input file path
 * @param ndjson - Whether to force NDJSON mode
 * @param context - The command context for error reporting
 */
export function validateInputFile(
  input: string,
  ndjson?: boolean,
  context: string = 'command'
): void {
  // Validate file exists
  if (!existsSync(input)) {
    handleCliError(
      new Error(
        `Input file not found: ${input}. Please check the file path and ensure the file exists.`
      ),
      context
    );
  }

  // Check if it's a directory - if so, skip file format validation
  const stats = fs.statSync(input);
  if (stats.isDirectory()) {
    return; // Directory scanning is handled by the scanner
  }

  // Validate file format for single files
  if (!validateFileFormat(input, ndjson)) {
    handleCliError(
      new Error(
        'Unsupported file format. Try: .json, .ndjson, .jsonl, or .txt input. See https://github.com/promptshield/promptshield-clean#supported-formats'
      ),
      context
    );
  }
}

/**
 * Validates RulePack file path and format
 * @param rulepackPath - The RulePack file path
 * @param context - The command context for error reporting
 */
export function validateRulePackFile(
  rulepackPath: string,
  context: string = 'command'
): void {
  // Validate file exists
  if (!existsSync(rulepackPath)) {
    handleCliError(
      new Error(
        `RulePack file not found: ${rulepackPath}. Please check the path or use --rulepack to specify a valid RulePack YAML file.`
      ),
      context
    );
  }

  // Validate file format
  if (!validateRulepack(rulepackPath)) {
    handleCliError(
      new Error(
        `Invalid RulePack file: ${rulepackPath}. Please check the file format and ensure it's a valid YAML file.`
      ),
      context
    );
  }
}

/**
 * Validates output file path and directory
 * @param outputPath - The output file path
 * @param context - The command context for error reporting
 */
export function validateOutputFile(
  outputPath: string,
  context: string = 'command'
): void {
  if (!outputPath) return;

  const outputDir = path.dirname(outputPath);

  // Check if output directory exists and is writable
  if (outputDir !== '.' && !fs.existsSync(outputDir)) {
    handleCliError(
      new Error(
        `Output directory does not exist: ${outputDir}. Please create the directory or specify a different output path.`
      ),
      context
    );
  }

  // Check if we can write to the directory
  try {
    const testFile = path.join(outputDir, '.test-write');
    fs.writeFileSync(testFile, '');
    fs.unlinkSync(testFile);
  } catch {
    handleCliError(
      new Error(
        `Cannot write to output directory: ${outputDir}. Please check permissions or specify a different location.`
      ),
      context
    );
  }
}

/**
 * Validates that rulepacks directory exists
 * @param rulepackDir - The rulepacks directory path
 * @param context - The command context for error reporting
 */
export function validateRulePacksDirectory(
  rulepackDir: string = 'rulepacks',
  context: string = 'command'
): void {
  if (!existsSync(rulepackDir)) {
    handleCliError(
      new Error(
        `No rulepacks directory found. Please ensure the "${rulepackDir}" directory exists in your project root. See https://github.com/promptshield/promptshield-clean#rulepacks`
      ),
      context
    );
  }
}
