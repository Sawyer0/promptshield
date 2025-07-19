/**
 * Clean Validation System
 * Single source of truth - no redundancy
 */

export {
  Validator,
  FileValidator,
  OptionValidator,
  ValidationResult,
} from './core';

// Simple exports for common validation tasks
import { Validator } from './core';
export const validateScan = Validator.scan;
export const validateCreate = Validator.create;
export const validateFile = Validator.file;
export const validateRulepack = Validator.rulepack;

// Schema validation (keep this one as it's unique)
export { schemaValidator, SchemaValidator } from './schemaValidator';
