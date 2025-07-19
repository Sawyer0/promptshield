import { Violation } from '../../../../shared/types/Violation';
import { ScanMetrics } from '../../../../shared/types/ScanMetrics';

/**
 * Represents the result of a scan operation
 */
export class ScanResult {
  constructor(
    public readonly violations: Violation[],
    public readonly metrics: ScanMetrics,
    public readonly timestamp: Date = new Date()
  ) {}

  /**
   * Gets violations filtered by severity
   */
  getViolationsBySeverity(severity: string[]): Violation[] {
    return this.violations.filter((v) => severity.includes(v.severity));
  }

  /**
   * Gets violations filtered by category
   */
  getViolationsByCategory(categories: string[]): Violation[] {
    if (categories.length === 0) return this.violations;
    return this.violations.filter((v) => categories.includes(v.category));
  }

  /**
   * Gets total violation count
   */
  getTotalViolations(): number {
    return this.violations.length;
  }

  /**
   * Gets violation count by severity
   */
  getViolationCountBySeverity(): Record<string, number> {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    this.violations.forEach((v) => {
      if (v.severity in counts) {
        counts[v.severity as keyof typeof counts]++;
      }
    });
    return counts;
  }

  /**
   * Checks if scan failed based on severity threshold
   */
  shouldFail(failOnSeverity?: string): boolean {
    if (!failOnSeverity) return false;
    return this.violations.some((v) => v.severity === failOnSeverity);
  }

  /**
   * Creates an empty scan result
   */
  static empty(): ScanResult {
    return new ScanResult([], {
      objectsScanned: 0,
      processingTime: 0,
      memoryUsage: 0,
      rulesApplied: 0,
      streamingUsed: false,
    });
  }
}
