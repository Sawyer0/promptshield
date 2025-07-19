/**
 * Metadata builder for output renderers
 * Provides utilities to build consistent metadata from scan results
 */

import { ScanResult, Violation } from '../../types/core/rule';
import { OutputMetadata } from '../../types/core/outputFormat';

export interface MetadataBuilderOptions {
  rulepack?: string;
  filters?: {
    severity?: string[];
    category?: string[];
  };
  options?: {
    maxViolations?: number;
    offset?: number;
    limit?: number;
  };
}

export class MetadataBuilder {
  /**
   * Builds metadata from scan results
   */
  static buildMetadata(
    results: ScanResult[],
    options: MetadataBuilderOptions = {}
  ): OutputMetadata {
    const severityBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    let totalViolations = 0;

    // Count violations by severity and category
    for (const result of results) {
      for (const violation of result.violations) {
        totalViolations++;

        // Severity breakdown
        const severity = violation.severity.toLowerCase();
        severityBreakdown[severity] = (severityBreakdown[severity] || 0) + 1;

        // Category breakdown
        const category = violation.category.toLowerCase();
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      }
    }

    return {
      scanDate: new Date().toISOString(),
      fileCount: results.length,
      totalViolations,
      severityBreakdown,
      categoryBreakdown,
      rulepack: options.rulepack,
      filters: options.filters,
      options: options.options,
    };
  }

  /**
   * Builds output context from scan results and options
   */
  static buildContext(
    results: ScanResult[],
    metadataOptions: MetadataBuilderOptions = {},
    outputOptions: {
      noColor?: boolean;
      verbose?: boolean;
      quiet?: boolean;
    } = {}
  ) {
    return {
      metadata: this.buildMetadata(results, metadataOptions),
      options: outputOptions,
    };
  }

  /**
   * Gets severity weight for sorting
   */
  static getSeverityWeight(severity: string): number {
    const weights: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[severity.toLowerCase()] || 0;
  }

  /**
   * Sorts violations by severity (highest first)
   */
  static sortViolationsBySeverity(violations: Violation[]): Violation[] {
    return violations.sort((a, b) => {
      const weightA = this.getSeverityWeight(a.severity);
      const weightB = this.getSeverityWeight(b.severity);
      return weightB - weightA; // Highest severity first
    });
  }

  /**
   * Formats severity for display
   */
  static formatSeverity(severity: string): string {
    return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  }

  /**
   * Formats category for display
   */
  static formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }
}
