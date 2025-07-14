/**
 * Reporting functionality for PromptShield
 */

class Reporter {
  private options: Record<string, unknown>;

  constructor(options: Record<string, unknown> = {}) {
    this.options = options;
  }

  /**
   * Generate a report from scan results
   * @param issues - Array of issues found
   * @param format - Output format (json, text)
   * @returns Formatted report
   */
  generateReport(issues: string[], format: string = 'text'): string {
    if (format === 'json') {
      return JSON.stringify(issues, null, 2);
    }
    // Default text format
    return this.formatTextReport(issues);
  }

  /**
   * Format issues as text report
   * @param issues - Array of issues found
   * @returns Text report
   */
  formatTextReport(issues: string[]): string {
    if (issues.length === 0) {
      return 'No issues found.';
    }
    return `Found ${issues.length} issue(s).`;
  }
}

export default Reporter;
