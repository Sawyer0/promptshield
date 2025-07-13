/**
 * String-based scanning logic for PromptShield
 */

import { Rule, Violation } from '../../types/core/rule';

/**
 * Scans a string for rule violations
 * @param data - The string to scan
 * @param rules - Array of rules to apply
 * @param filePath - The file path for context
 * @param context - Optional context (objectIndex, field)
 * @returns Array of violations
 */
export function scanStringWithRules(
  data: string,
  rules: Rule[],
  filePath: string,
  context?: { objectIndex?: number; field?: string }
): Violation[] {
  const violations: Violation[] = [];
  for (const rule of rules) {
    if (rule.enabled === false) continue;
    let regex: RegExp;
    try {
      regex = new RegExp(rule.pattern, 'g');
    } catch {
      throw new Error(`Invalid regex in rule '${rule.id}': ${rule.pattern}`);
    }
    let match: RegExpExecArray | null;
    while ((match = regex.exec(data)) !== null) {
      violations.push({
        ruleId: rule.id,
        message: rule.description,
        match: match[0],
        severity: rule.severity || 'medium',
        category: rule.category || '',
        filePath,
        objectIndex: context?.objectIndex,
        field: context?.field,
      });
    }
  }
  return violations;
}
