import { OutputValidationResult } from './json';

export async function compareWithSample(
  actualOutput: unknown,
  samplePath: string
): Promise<OutputValidationResult> {
  const result: OutputValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Import fs dynamically to avoid require issues
    const fs = await import('fs');

    const sampleContent = fs.readFileSync(samplePath, 'utf8');
    const sampleData = JSON.parse(sampleContent);

    if (Array.isArray(actualOutput) && Array.isArray(sampleData)) {
      const comparisonErrors = await compareScanResults(
        actualOutput,
        sampleData,
        0
      );
      result.errors.push(...comparisonErrors);
    } else {
      result.errors.push('Both actual and sample outputs must be arrays');
    }

    if (result.errors.length > 0) {
      result.isValid = false;
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to compare with sample: ${error}`);
  }

  return result;
}

export async function compareScanResults(
  actual: unknown[],
  expected: unknown[],
  index: number
): Promise<string[]> {
  const errors: string[] = [];

  if (actual.length !== expected.length) {
    errors.push(
      `Expected ${expected.length} scan results, got ${actual.length}`
    );
    return errors;
  }

  for (let scanIndex = 0; scanIndex < actual.length; scanIndex++) {
    const expectedResult = expected[scanIndex] as Record<string, unknown>;
    const actualResult = actual[scanIndex] as Record<string, unknown>;

    // Compare basic fields
    if (actualResult.file !== expectedResult.file) {
      errors.push(
        `Scan ${index + scanIndex}: File mismatch - expected "${expectedResult.file}", got "${actualResult.file}"`
      );
    }

    if (actualResult.violations && expectedResult.violations) {
      const actualViolations = actualResult.violations as unknown[];
      const expectedViolations = expectedResult.violations as unknown[];

      if (actualViolations.length !== expectedViolations.length) {
        errors.push(
          `Scan ${index + scanIndex}: Violation count mismatch - expected ${expectedViolations.length}, got ${actualViolations.length}`
        );
      }
    }
  }

  return errors;
}
