import { Violation } from '../../types/core/rule';
import {
  Severity,
  Category,
  SeverityEnum,
  CategoryEnum,
} from '../../types/core/severity';

export function getUniqueCategories(violations: Violation[]): Category[] {
  const categories = new Set<Category>();
  violations.forEach((violation) => {
    categories.add(violation.category as Category);
  });
  return Array.from(categories);
}

export function getUniqueSeverities(violations: Violation[]): Severity[] {
  const severities = new Set<Severity>();
  violations.forEach((violation) => {
    severities.add(violation.severity as Severity);
  });
  return Array.from(severities);
}

export function countBySeverity(
  violations: Violation[]
): Record<string, number> {
  const counts: Record<string, number> = {
    [SeverityEnum.Low]: 0,
    [SeverityEnum.Medium]: 0,
    [SeverityEnum.High]: 0,
    [SeverityEnum.Critical]: 0,
  };

  violations.forEach((violation) => {
    const severity = violation.severity as Severity;
    if (severity in counts) {
      counts[severity]++;
    }
  });

  return counts;
}

export function countByCategory(
  violations: Violation[]
): Record<string, number> {
  const counts: Record<string, number> = {
    [CategoryEnum.PII]: 0,
    [CategoryEnum.Bias]: 0,
    [CategoryEnum.Hallucination]: 0,
    [CategoryEnum.Security]: 0,
    [CategoryEnum.Compliance]: 0,
    [CategoryEnum.Parse]: 0,
    [CategoryEnum.Internal]: 0,
    [CategoryEnum.Custom]: 0,
  };

  violations.forEach((violation) => {
    const category = violation.category as Category;
    if (category in counts) {
      counts[category]++;
    }
  });

  return counts;
}

export function getViolationsSummary(violations: Violation[]) {
  const severityCounts = countBySeverity(violations);
  const categoryCounts = countByCategory(violations);
  const uniqueCategories = getUniqueCategories(violations);
  const uniqueSeverities = getUniqueSeverities(violations);

  return {
    total: violations.length,
    severityCounts,
    categoryCounts,
    uniqueCategories,
    uniqueSeverities,
    hasHighSeverity:
      severityCounts[SeverityEnum.High] > 0 ||
      severityCounts[SeverityEnum.Critical] > 0,
    hasCriticalSeverity: severityCounts[SeverityEnum.Critical] > 0,
  };
}
