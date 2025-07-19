import { Rule } from '../src/types/core/rule';

export interface ValidationResult {
  ruleId: string;
  errors: string[];
  warnings: string[];
}

export function validateRulePack(
  rulePack: Rule[],
  opts?: { strict?: boolean }
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const seenIds = new Set<string>();
  for (const rule of rulePack) {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!rule.id) errors.push('Missing id');
    if (!rule.description) errors.push('Missing description');
    if (!rule.pattern) errors.push('Missing pattern');
    if (seenIds.has(rule.id)) warnings.push('Duplicate id');
    seenIds.add(rule.id);
    try {
      new RegExp(rule.pattern);
    } catch {
      errors.push('Invalid regex pattern');
    }
    if (opts?.strict) {
      if (!rule.category) errors.push('Missing category (strict mode)');
      if (!rule.severity) errors.push('Missing severity (strict mode)');
    }
    results.push({ ruleId: rule.id, errors, warnings });
  }
  return results;
}
