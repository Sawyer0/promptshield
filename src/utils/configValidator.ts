/**
 * Configuration validation utilities for PromptShield
 * Provides validation for scan configurations and CLI options
 */

import { ScanConfig, CompressionConfig } from '../types/core/scanConfig';
import { SeverityEnum } from '../types/core/severity';
import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates scan configuration options
 */
export function validateScanConfig(config: ScanConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate maxObjects
  if (config.maxObjects !== undefined) {
    if (typeof config.maxObjects !== 'number' || config.maxObjects < 1) {
      errors.push('maxObjects must be a positive number');
    }
  }

  // Validate maxDepth
  if (config.maxDepth !== undefined) {
    if (
      typeof config.maxDepth !== 'number' ||
      config.maxDepth < 1 ||
      config.maxDepth > 10
    ) {
      errors.push('maxDepth must be between 1 and 10');
    }
  }

  // Validate compression
  if (config.compression) {
    const compressionResult = validateCompressionConfig(config.compression);
    errors.push(...compressionResult.errors);
    warnings.push(...compressionResult.warnings);
  }

  // Validate memory warning threshold
  if (config.memoryWarningThreshold !== undefined) {
    if (
      typeof config.memoryWarningThreshold !== 'number' ||
      config.memoryWarningThreshold < 0 ||
      config.memoryWarningThreshold > 1
    ) {
      errors.push('memoryWarningThreshold must be between 0.0 and 1.0');
    }
  }

  // Validate streaming threshold
  if (config.streamingThreshold !== undefined) {
    if (
      typeof config.streamingThreshold !== 'number' ||
      config.streamingThreshold < 1
    ) {
      errors.push('streamingThreshold must be a positive number');
    }
  }

  // Validate fields to scan
  if (config.fieldsToScan && !Array.isArray(config.fieldsToScan)) {
    errors.push('fieldsToScan must be an array of strings');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates compression configuration
 */
export function validateCompressionConfig(
  compression: CompressionConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate compression type
  if (!['gzip', 'deflate'].includes(compression.type)) {
    errors.push('Compression type must be "gzip" or "deflate"');
  }

  // Validate compression level
  if (
    typeof compression.level !== 'number' ||
    compression.level < 1 ||
    compression.level > 9
  ) {
    errors.push('Compression level must be between 1 and 9');
  }

  // Warn about high compression levels
  if (compression.level > 6) {
    warnings.push('High compression levels may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates severity levels
 */
export function validateSeverity(severity: string): boolean {
  return Object.values(SeverityEnum).includes(severity as SeverityEnum);
}

/**
 * Validates file paths
 */
export function validateFilePath(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!filePath || typeof filePath !== 'string') {
    errors.push('File path must be a non-empty string');
    return { isValid: false, errors, warnings };
  }

  // Check for common path issues
  if (filePath.includes('..')) {
    warnings.push('File path contains parent directory references');
  }

  if (filePath.length > 260) {
    warnings.push('File path is very long, may cause issues on some systems');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs validation results using the logger
 */
export function logValidationResults(
  result: ValidationResult,
  context: string
): void {
  if (result.errors.length > 0) {
    logger.error(`${context} validation failed:`);
    result.errors.forEach((error) => {
      logger.error(`  - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    logger.warn(`${context} validation warnings:`);
    result.warnings.forEach((warning) => {
      logger.warn(`  - ${warning}`);
    });
  }
}
