/**
 * Modern PromptShield Validation System
 * Clean, efficient, single source of truth
 */

import { existsSync } from 'fs';
import * as path from 'path';
import { Severity } from '../types/core/severity';

// Standardized validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * FILE VALIDATION
 */
export class FileValidator {
  static exists(filePath: string): boolean {
    return existsSync(filePath);
  }

  static validateRulePack(rulepackPath: string): ValidationResult {
    if (!this.exists(rulepackPath)) {
      return {
        isValid: false,
        errors: [`RulePack not found: ${rulepackPath}`],
        warnings: [],
      };
    }

    const ext = path.extname(rulepackPath).toLowerCase();
    if (ext !== '.yaml' && ext !== '.yml') {
      return {
        isValid: false,
        errors: [`RulePack must be .yaml/.yml: ${rulepackPath}`],
        warnings: [],
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  static validateDataFile(
    filePath: string,
    ndjson?: boolean
  ): ValidationResult {
    if (!this.exists(filePath)) {
      return {
        isValid: false,
        errors: [`Input file not found: ${filePath}`],
        warnings: [],
      };
    }

    const ext = path.extname(filePath).toLowerCase();
    const allowedFormats = ndjson
      ? ['.ndjson', '.jsonl']
      : ['.json', '.ndjson', '.jsonl', '.txt'];

    if (!allowedFormats.includes(ext)) {
      return {
        isValid: false,
        errors: [
          `Invalid format: ${filePath}. Expected: ${allowedFormats.join(', ')}`,
        ],
        warnings: [],
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }
}

/**
 * OPTION VALIDATION
 */
export class OptionValidator {
  static validateSeverity(severity: string): ValidationResult {
    const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity as Severity)) {
      return {
        isValid: false,
        errors: [
          `Invalid severity: ${severity}. Valid: ${validSeverities.join(', ')}`,
        ],
        warnings: [],
      };
    }
    return { isValid: true, errors: [], warnings: [] };
  }

  static validateOutputFormat(format: string): ValidationResult {
    const validFormats = ['json', 'ndjson', 'table', 'csv', 'markdown', 'html'];
    if (!validFormats.includes(format)) {
      return {
        isValid: false,
        errors: [
          `Invalid output format: ${format}. Valid: ${validFormats.join(', ')}`,
        ],
        warnings: [],
      };
    }
    return { isValid: true, errors: [], warnings: [] };
  }

  static validateNumeric(
    value: string | number,
    min?: number,
    max?: number,
    name: string = 'value'
  ): ValidationResult {
    const num = typeof value === 'string' ? parseInt(value) : value;

    if (isNaN(num)) {
      return {
        isValid: false,
        errors: [`${name} must be a number`],
        warnings: [],
      };
    }

    if (min !== undefined && num < min) {
      return {
        isValid: false,
        errors: [`${name} must be at least ${min}`],
        warnings: [],
      };
    }

    if (max !== undefined && num > max) {
      return {
        isValid: false,
        errors: [`${name} must be at most ${max}`],
        warnings: [],
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }
}

/**
 * UNIFIED VALIDATOR
 */
export class Validator {
  static scan(input: string, options: any) {
    // Validate input file
    const fileResult = FileValidator.validateDataFile(input, options.ndjson);
    if (!fileResult.isValid) {
      throw new Error(fileResult.errors[0]);
    }

    // Validate rulepack
    if (options.rulepack) {
      const rulepackResult = FileValidator.validateRulePack(options.rulepack);
      if (!rulepackResult.isValid) {
        throw new Error(rulepackResult.errors[0]);
      }
    }

    // Validate severity
    if (options.failSeverity) {
      const severityResult = OptionValidator.validateSeverity(
        options.failSeverity
      );
      if (!severityResult.isValid) {
        throw new Error(severityResult.errors[0]);
      }
    }

    // Validate output format
    if (options.output) {
      const formatResult = OptionValidator.validateOutputFormat(options.output);
      if (!formatResult.isValid) {
        throw new Error(formatResult.errors[0]);
      }
    }

    return {
      rulepackPath: options.rulepack || 'rulepacks/pii.yaml',
      failSeverity: options.failSeverity || 'medium',
      scanConfig: options,
    };
  }

  static create(name: string, options: any = {}): void {
    if (!name || name.trim().length === 0) {
      throw new Error('RulePack name is required');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      throw new Error(
        'RulePack name can only contain letters, numbers, hyphens, and underscores'
      );
    }

    if (options.output && !FileValidator.exists(path.dirname(options.output))) {
      throw new Error(
        `Output directory does not exist: ${path.dirname(options.output)}`
      );
    }
  }

  static file(filePath: string): boolean {
    return FileValidator.exists(filePath);
  }

  static rulepack(rulepackPath: string): boolean {
    return FileValidator.validateRulePack(rulepackPath).isValid;
  }
}
