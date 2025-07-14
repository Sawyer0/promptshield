/**
 * Markdown report formatting for PromptShield CLI
 */

import { ScanResult } from '../../types/core/rule';

/**
 * Formats scan results as markdown
 * @param results - Array of scan results
 * @returns Formatted markdown string
 */
export function formatMarkdown(results: ScanResult[]): string {
  let out = '';
  for (const result of results) {
    out += `## File: ${result.file}\n`;
    if (result.violations.length === 0) {
      out += `- No issues found.\n`;
    } else {
      for (const v of result.violations) {
        let context = '';
        if (v.objectIndex !== undefined && v.field) {
          context = ` [Object ${v.objectIndex}, field: ${v.field}]`;
        } else if (v.field) {
          context = ` [field: ${v.field}]`;
        } else if (v.lineNumber) {
          context = ` [line: ${v.lineNumber}]`;
        }

        out += `- **[${v.severity}]** \`${v.ruleId}\` (${v.category}): ${v.message} (\`${v.match}\`)${context}\n`;
      }
    }
    out += '\n';
  }
  return out;
}
