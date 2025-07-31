/**
 * Minimal JSON output validation
 * Simplified version for unified JSON processing
 */

export interface OutputValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateJsonOutput(output: unknown): OutputValidationResult {
  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      errors: ['Output is not an object'],
      warnings: [],
    };
  }

  return { isValid: true, errors: [], warnings: [] };
}

export function validateScanResult(result: unknown): OutputValidationResult {
  return validateJsonOutput(result);
}

export function validateViolation(violation: unknown): OutputValidationResult {
  return validateJsonOutput(violation);
}
