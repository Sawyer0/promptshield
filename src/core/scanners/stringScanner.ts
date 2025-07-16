/**
 * String-based scanning logic for PromptShield
 *
 * This module provides the foundation for scanning text content against rules.
 * It serves as a bridge between the higher-level scanning functions and the
 * core rule application logic, handling context management and violation creation.
 */

import { Rule, Violation } from '../../types/core/rule';
import { applyRulesToText } from '../rules';

/**
 * Scans a string for rule violations using enhanced rule matching
 *
 * This function is the primary interface for scanning text content against
 * a set of rules. It delegates to the core rule application logic while
 * providing proper context management for violation reporting.
 *
 * The function supports:
 * - Multiple rule types (keywords, regex patterns)
 * - Case-sensitive and case-insensitive matching
 * - Context-aware violation reporting (file path, object index, field)
 * - Comprehensive error handling for invalid patterns
 *
 * @param data - The string content to scan for rule violations
 * @param rules - Array of rules to apply to the text content
 * @param filePath - File path for context in violation objects
 * @param context - Optional context information (objectIndex, field) for detailed violation reporting
 * @returns Array of Violation objects representing all rule matches found in the text
 *
 * @example
 * ```typescript
 * const rules = [
 *   {
 *     id: 'email',
 *     description: 'Detects email addresses',
 *     severity: 'high',
 *     category: 'pii',
 *     match_regex: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'],
 *     enabled: true
 *   }
 * ];
 *
 * const violations = scanStringWithRules(
 *   'Contact us at john@example.com for support',
 *   rules,
 *   'data/prompts.json',
 *   { objectIndex: 0, field: 'prompt' }
 * );
 *
 * // Returns array with one violation for the email match
 * console.log(`Found ${violations.length} violations`);
 * ```
 */
export function scanStringWithRules(
  data: string,
  rules: Rule[],
  filePath: string,
  context?: { objectIndex?: number; field?: string }
): Violation[] {
  return applyRulesToText(data, rules, filePath, context);
}
