/**
 * JSON object scanning logic for PromptShield
 */

import { Rule, Violation } from '../../types/core/rule';
import { JsonObject } from '../../types/data/json';
import { ScanConfig } from '../../types/core/scanConfig';
import { getNestedValue } from '../../services/nestedJsonScanner';
import { scanStringWithRules } from './stringScanner';

/**
 * Scans a JSON object with configurable fields and nested structure support
 * @param object - The JSON object to scan
 * @param objectIndex - Index of the object in the array
 * @param rules - Array of rules to apply
 * @param filePath - The file path for context
 * @param config - Scan configuration
 * @returns Array of violations
 */
export function scanJsonObjectWithRules(
  object: JsonObject,
  objectIndex: number,
  rules: Rule[],
  filePath: string,
  config: ScanConfig = {}
): Violation[] {
  const violations: Violation[] = [];
  const fieldsToScan = config.fieldsToScan || ['prompt', 'response'];
  const maxDepth = config.maxDepth ?? 4;

  // Check if any fields contain dot notation (nested paths)
  const hasNestedFields = fieldsToScan.some((field) => field.includes('.'));

  if (hasNestedFields) {
    // Use nested scanning for dot notation fields
    for (const field of fieldsToScan) {
      const value = getNestedValue(object, field, maxDepth);
      if (value && typeof value === 'string') {
        const fieldViolations = scanStringWithRules(value, rules, filePath, {
          objectIndex,
          field,
        });
        violations.push(...fieldViolations);
      }
    }
  } else {
    // Use traditional flat field scanning
    for (const field of fieldsToScan) {
      if (object[field] && typeof object[field] === 'string') {
        const fieldViolations = scanStringWithRules(
          object[field] as string,
          rules,
          filePath,
          { objectIndex, field }
        );
        violations.push(...fieldViolations);
      }
    }
  }

  // Optionally scan entire object as string (fallback)
  if (config.scanEntireObject) {
    const objectString = JSON.stringify(object);
    const objectViolations = scanStringWithRules(
      objectString,
      rules,
      filePath,
      { objectIndex, field: 'object' }
    );
    violations.push(...objectViolations);
  }

  return violations;
}
