/**
 * Shared result processing utilities for CLI commands
 * Provides consistent result filtering, pagination, and truncation
 */

import { ScanResult, Violation } from '../../../types/core/rule';
import { Severity } from '../../../types/core/severity';
import { parseCommaSeparated } from '../../validators/options';

const severityWeight: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Filters violations based on severity and category filters
 * @param results - The scan results to filter
 * @param severityFilter - Comma-separated severity levels
 * @param categoryFilter - Comma-separated categories
 * @returns Filtered scan results
 */
export function filterViolations(
  results: ScanResult[],
  severityFilter?: string,
  categoryFilter?: string
): ScanResult[] {
  if (!severityFilter && !categoryFilter) {
    return results;
  }

  const allowedSeverities = severityFilter
    ? parseCommaSeparated(severityFilter)
    : [];
  const allowedCategories = categoryFilter
    ? parseCommaSeparated(categoryFilter)
    : [];

  return results.map((result) => ({
    ...result,
    violations: result.violations.filter((violation) => {
      const severityMatch =
        !allowedSeverities.length ||
        allowedSeverities.includes(violation.severity);
      const categoryMatch =
        !allowedCategories.length ||
        allowedCategories.includes(violation.category);
      return severityMatch && categoryMatch;
    }),
  }));
}

/**
 * Applies pagination to scan results
 * @param results - The scan results to paginate
 * @param offset - The offset for pagination
 * @param limit - The limit for pagination
 * @returns Paginated scan results
 */
export function applyPagination(
  results: ScanResult[],
  offset?: string,
  limit?: string
): ScanResult[] {
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  const limitNum = limit ? parseInt(limit, 10) : undefined;

  const allViolations = results.flatMap((result) =>
    result.violations.map((violation) => ({ ...violation, file: result.file }))
  );

  const paginatedViolations = limitNum
    ? allViolations.slice(offsetNum, offsetNum + limitNum)
    : allViolations.slice(offsetNum);

  const groupedResults = new Map<string, ScanResult>();

  paginatedViolations.forEach((violation) => {
    if (!groupedResults.has(violation.file)) {
      groupedResults.set(violation.file, {
        file: violation.file,
        violations: [],
        durationMs: 0,
      });
    }
    const result = groupedResults.get(violation.file)!;
    result.violations.push(violation);
  });

  return Array.from(groupedResults.values());
}

/**
 * Truncates results based on maximum violations limit
 * @param results - The scan results to truncate
 * @param maxViolations - Maximum number of violations to include
 * @returns Truncated scan results
 */
export function truncateResults(
  results: ScanResult[],
  maxViolations?: string
): ScanResult[] {
  if (!maxViolations) {
    return results;
  }

  const maxNum = parseInt(maxViolations, 10);
  let totalViolations = 0;

  return results.map((result) => {
    const remainingSlots = maxNum - totalViolations;
    if (remainingSlots <= 0) {
      return { ...result, violations: [] };
    }

    const truncatedViolations = result.violations.slice(0, remainingSlots);
    totalViolations += truncatedViolations.length;

    return {
      ...result,
      violations: truncatedViolations,
    };
  });
}

/**
 * Checks if scan should fail based on severity threshold
 * @param results - The scan results to check
 * @param failSeverity - The severity level that should cause failure
 * @returns True if scan should fail
 */
export function shouldFailOnSeverity(
  results: ScanResult[],
  failSeverity: Severity
): boolean {
  return results.some((result) =>
    result.violations.some(
      (v: Violation) =>
        severityWeight[v.severity as Severity] >= severityWeight[failSeverity]
    )
  );
}

/**
 * Gets summary statistics from scan results
 * @param results - The scan results to analyze
 * @returns Summary statistics
 */
export function getResultSummary(results: ScanResult[]): {
  totalViolations: number;
  totalFiles: number;
  hasViolations: boolean;
} {
  const totalViolations = results.reduce(
    (sum, r) => sum + r.violations.length,
    0
  );
  const totalFiles = results.length;

  return {
    totalViolations,
    totalFiles,
    hasViolations: totalViolations > 0,
  };
}
