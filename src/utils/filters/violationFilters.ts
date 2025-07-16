import { Violation } from '../../types/core/rule';
import { Severity, Category, SeverityEnum } from '../../types/core/severity';

export function filterBySeverity(
  violations: Violation[],
  severity: Severity
): Violation[] {
  const severityWeight = {
    [SeverityEnum.Low]: 1,
    [SeverityEnum.Medium]: 2,
    [SeverityEnum.High]: 3,
    [SeverityEnum.Critical]: 4,
  };

  const minWeight =
    severityWeight[severity as keyof typeof severityWeight] || 0;

  return violations.filter((violation) => {
    const violationWeight =
      severityWeight[violation.severity as keyof typeof severityWeight] || 0;
    return violationWeight >= minWeight;
  });
}

export function filterByCategory(
  violations: Violation[],
  categories: Category[] = []
): Violation[] {
  if (categories.length === 0) {
    return violations; // Return all if no categories specified
  }

  return violations.filter((violation) =>
    categories.includes(violation.category as Category)
  );
}

export function filterViolations(
  violations: Violation[],
  options: {
    minSeverity?: Severity;
    categories?: Category[];
    enabled?: boolean;
  } = {}
): Violation[] {
  let filtered = violations;

  // Filter by minimum severity
  if (options.minSeverity) {
    filtered = filterBySeverity(filtered, options.minSeverity);
  }

  // Filter by categories
  if (options.categories && options.categories.length > 0) {
    filtered = filterByCategory(filtered, options.categories);
  }

  return filtered;
}
