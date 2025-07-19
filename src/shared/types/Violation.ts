/**
 * Represents a rule violation found during scanning
 */
export interface Violation {
  // Rule information
  ruleId: string;
  ruleName: string;
  ruleDescription: string;

  // Violation details
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;

  // Location information
  field: string;
  objectIndex: number;
  position?: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };

  // Context
  context: {
    before?: string;
    match: string;
    after?: string;
  };

  // Additional data
  metadata?: {
    pattern?: string;
    confidence?: number;
    tags?: string[];
  };
}

/**
 * Represents a collection of violations with summary information
 */
export interface ViolationSummary {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  byRule: Record<string, number>;
}

/**
 * Utility functions for working with violations
 */
export const ViolationUtils = {
  /**
   * Creates a violation summary from a list of violations
   */
  createSummary(violations: Violation[]): ViolationSummary {
    const summary: ViolationSummary = {
      total: violations.length,
      bySeverity: {},
      byCategory: {},
      byRule: {},
    };

    violations.forEach((violation) => {
      // Count by severity
      summary.bySeverity[violation.severity] =
        (summary.bySeverity[violation.severity] || 0) + 1;

      // Count by category
      summary.byCategory[violation.category] =
        (summary.byCategory[violation.category] || 0) + 1;

      // Count by rule
      summary.byRule[violation.ruleId] =
        (summary.byRule[violation.ruleId] || 0) + 1;
    });

    return summary;
  },

  /**
   * Filters violations by severity
   */
  filterBySeverity(violations: Violation[], severities: string[]): Violation[] {
    if (severities.length === 0) return violations;
    return violations.filter((v) => severities.includes(v.severity));
  },

  /**
   * Filters violations by category
   */
  filterByCategory(violations: Violation[], categories: string[]): Violation[] {
    if (categories.length === 0) return violations;
    return violations.filter((v) => categories.includes(v.category));
  },

  /**
   * Sorts violations by severity (critical first)
   */
  sortBySeverity(violations: Violation[]): Violation[] {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return violations.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  },

  /**
   * Groups violations by field
   */
  groupByField(violations: Violation[]): Record<string, Violation[]> {
    const groups: Record<string, Violation[]> = {};
    violations.forEach((violation) => {
      if (!groups[violation.field]) {
        groups[violation.field] = [];
      }
      groups[violation.field].push(violation);
    });
    return groups;
  },
};
