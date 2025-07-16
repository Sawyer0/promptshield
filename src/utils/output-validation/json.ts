import { SeverityEnum, CategoryEnum } from '../../types/core/severity';

export interface OutputValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateJsonOutput(
  jsonOutput: unknown
): OutputValidationResult {
  const result: OutputValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check if output is an array
    if (!Array.isArray(jsonOutput)) {
      result.isValid = false;
      result.errors.push('Output must be an array');
      return result;
    }

    // Validate each scan result
    jsonOutput.forEach((scanResult: unknown, index: number) => {
      const scanResultErrors = validateScanResult(scanResult, index);
      result.errors.push(...scanResultErrors);
    });

    if (result.errors.length > 0) {
      result.isValid = false;
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to parse JSON output: ${error}`);
  }

  return result;
}

export function validateScanResult(
  scanResult: unknown,
  index: number
): string[] {
  const errors: string[] = [];

  // Required fields
  const requiredFields = ['file', 'violations', 'durationMs'];
  requiredFields.forEach((field) => {
    if (!(field in (scanResult as Record<string, unknown>))) {
      errors.push(`Scan result ${index}: Missing required field '${field}'`);
    }
  });

  if (errors.length > 0) return errors;

  const result = scanResult as Record<string, unknown>;

  // Validate field types
  if (typeof result.file !== 'string') {
    errors.push(`Scan result ${index}: 'file' must be a string`);
  }

  if (!Array.isArray(result.violations)) {
    errors.push(`Scan result ${index}: 'violations' must be an array`);
  }

  if (typeof result.durationMs !== 'number') {
    errors.push(`Scan result ${index}: 'durationMs' must be a number`);
  }

  // Validate violations if array exists
  if (Array.isArray(result.violations)) {
    result.violations.forEach((violation: unknown, vIndex: number) => {
      const violationErrors = validateViolation(violation, index, vIndex);
      errors.push(...violationErrors);
    });
  }

  return errors;
}

export function validateViolation(
  violation: unknown,
  scanIndex: number,
  violationIndex: number
): string[] {
  const errors: string[] = [];

  // Required fields
  const requiredFields = [
    'ruleId',
    'message',
    'match',
    'severity',
    'category',
    'filePath',
  ];
  requiredFields.forEach((field) => {
    if (!(field in (violation as Record<string, unknown>))) {
      errors.push(
        `Violation ${scanIndex}.${violationIndex}: Missing required field '${field}'`
      );
    }
  });

  if (errors.length > 0) return errors;

  const violationObj = violation as Record<string, unknown>;

  // Validate field types
  if (typeof violationObj.ruleId !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'ruleId' must be a string`
    );
  }

  if (typeof violationObj.message !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'message' must be a string`
    );
  }

  if (typeof violationObj.match !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'match' must be a string`
    );
  }

  if (typeof violationObj.severity !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'severity' must be a string`
    );
  }

  if (typeof violationObj.category !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'category' must be a string`
    );
  }

  if (typeof violationObj.filePath !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'filePath' must be a string`
    );
  }

  // Validate enum values
  if (
    typeof violationObj.severity === 'string' &&
    !Object.values(SeverityEnum).includes(violationObj.severity as SeverityEnum)
  ) {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: Invalid severity value '${violationObj.severity}'`
    );
  }

  if (
    typeof violationObj.category === 'string' &&
    !Object.values(CategoryEnum).includes(violationObj.category as CategoryEnum)
  ) {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: Invalid category value '${violationObj.category}'`
    );
  }

  // Optional fields
  if (
    'objectIndex' in violationObj &&
    typeof violationObj.objectIndex !== 'number'
  ) {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'objectIndex' must be a number`
    );
  }

  if ('field' in violationObj && typeof violationObj.field !== 'string') {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'field' must be a string`
    );
  }

  if (
    'lineNumber' in violationObj &&
    typeof violationObj.lineNumber !== 'number'
  ) {
    errors.push(
      `Violation ${scanIndex}.${violationIndex}: 'lineNumber' must be a number`
    );
  }

  return errors;
}
