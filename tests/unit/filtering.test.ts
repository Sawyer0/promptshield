/**
 * Unit tests for filtering utilities
 */

import {
  filterBySeverity,
  filterByCategory,
  filterViolations,
  getUniqueCategories,
  getUniqueSeverities,
  countBySeverity,
  countByCategory,
  getViolationsSummary,
} from '../../src/utils/filters';
import { Violation } from '../../src/types/core/rule';
import { SeverityEnum, CategoryEnum } from '../../src/types/core/severity';
import { createViolation } from '../../src/types/core/rule';

describe('Filtering Utilities', () => {
  const mockViolations: Violation[] = [
    createViolation({
      ruleId: 'test-1',
      message: 'Test violation 1',
      match: 'test1',
      severity: SeverityEnum.Low,
      category: CategoryEnum.PII,
      filePath: 'test.json',
    }),
    createViolation({
      ruleId: 'test-2',
      message: 'Test violation 2',
      match: 'test2',
      severity: SeverityEnum.Medium,
      category: CategoryEnum.Bias,
      filePath: 'test.json',
    }),
    createViolation({
      ruleId: 'test-3',
      message: 'Test violation 3',
      match: 'test3',
      severity: SeverityEnum.High,
      category: CategoryEnum.PII,
      filePath: 'test.json',
    }),
    createViolation({
      ruleId: 'test-4',
      message: 'Test violation 4',
      match: 'test4',
      severity: SeverityEnum.Critical,
      category: CategoryEnum.Security,
      filePath: 'test.json',
    }),
  ];

  describe('filterBySeverity', () => {
    test('filters violations by minimum severity level', () => {
      const highViolations = filterBySeverity(
        mockViolations,
        SeverityEnum.High
      );
      expect(highViolations).toHaveLength(2);
      expect(
        highViolations.every((v) =>
          [SeverityEnum.High, SeverityEnum.Critical].includes(
            v.severity as SeverityEnum
          )
        )
      ).toBe(true);

      const mediumViolations = filterBySeverity(
        mockViolations,
        SeverityEnum.Medium
      );
      expect(mediumViolations).toHaveLength(3);
      expect(
        mediumViolations.every((v) =>
          [
            SeverityEnum.Medium,
            SeverityEnum.High,
            SeverityEnum.Critical,
          ].includes(v.severity as SeverityEnum)
        )
      ).toBe(true);
    });

    test('returns all violations when filtering by low severity', () => {
      const allViolations = filterBySeverity(mockViolations, SeverityEnum.Low);
      expect(allViolations).toHaveLength(4);
    });
  });

  describe('filterByCategory', () => {
    test('filters violations by specific categories', () => {
      const piiViolations = filterByCategory(mockViolations, [
        CategoryEnum.PII,
      ]);
      expect(piiViolations).toHaveLength(2);
      expect(piiViolations.every((v) => v.category === CategoryEnum.PII)).toBe(
        true
      );

      const biasViolations = filterByCategory(mockViolations, [
        CategoryEnum.Bias,
      ]);
      expect(biasViolations).toHaveLength(1);
      expect(biasViolations[0].category).toBe(CategoryEnum.Bias);
    });

    test('filters by multiple categories', () => {
      const multiCategoryViolations = filterByCategory(mockViolations, [
        CategoryEnum.PII,
        CategoryEnum.Security,
      ]);
      expect(multiCategoryViolations).toHaveLength(3);
      expect(
        multiCategoryViolations.every((v) =>
          [CategoryEnum.PII, CategoryEnum.Security].includes(
            v.category as CategoryEnum
          )
        )
      ).toBe(true);
    });

    test('returns all violations when no categories specified', () => {
      const allViolations = filterByCategory(mockViolations, []);
      expect(allViolations).toHaveLength(4);
    });
  });

  describe('filterViolations', () => {
    test('filters by both severity and category', () => {
      const filtered = filterViolations(mockViolations, {
        minSeverity: SeverityEnum.Medium,
        categories: [CategoryEnum.PII],
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe(SeverityEnum.High);
      expect(filtered[0].category).toBe(CategoryEnum.PII);
    });

    test('filters by severity only', () => {
      const filtered = filterViolations(mockViolations, {
        minSeverity: SeverityEnum.High,
      });
      expect(filtered).toHaveLength(2);
    });

    test('filters by category only', () => {
      const filtered = filterViolations(mockViolations, {
        categories: [CategoryEnum.Bias],
      });
      expect(filtered).toHaveLength(1);
    });

    test('returns all violations when no filters specified', () => {
      const filtered = filterViolations(mockViolations, {});
      expect(filtered).toHaveLength(4);
    });
  });

  describe('getUniqueCategories', () => {
    test('returns unique categories from violations', () => {
      const uniqueCategories = getUniqueCategories(mockViolations);
      expect(uniqueCategories).toHaveLength(3);
      expect(uniqueCategories).toContain(CategoryEnum.PII);
      expect(uniqueCategories).toContain(CategoryEnum.Bias);
      expect(uniqueCategories).toContain(CategoryEnum.Security);
    });
  });

  describe('getUniqueSeverities', () => {
    test('returns unique severities from violations', () => {
      const uniqueSeverities = getUniqueSeverities(mockViolations);
      expect(uniqueSeverities).toHaveLength(4);
      expect(uniqueSeverities).toContain(SeverityEnum.Low);
      expect(uniqueSeverities).toContain(SeverityEnum.Medium);
      expect(uniqueSeverities).toContain(SeverityEnum.High);
      expect(uniqueSeverities).toContain(SeverityEnum.Critical);
    });
  });

  describe('countBySeverity', () => {
    test('counts violations by severity', () => {
      const counts = countBySeverity(mockViolations);
      expect(counts[SeverityEnum.Low]).toBe(1);
      expect(counts[SeverityEnum.Medium]).toBe(1);
      expect(counts[SeverityEnum.High]).toBe(1);
      expect(counts[SeverityEnum.Critical]).toBe(1);
    });
  });

  describe('countByCategory', () => {
    test('counts violations by category', () => {
      const counts = countByCategory(mockViolations);
      expect(counts[CategoryEnum.PII]).toBe(2);
      expect(counts[CategoryEnum.Bias]).toBe(1);
      expect(counts[CategoryEnum.Security]).toBe(1);
      expect(counts[CategoryEnum.Hallucination]).toBe(0);
    });
  });

  describe('getViolationsSummary', () => {
    test('returns comprehensive summary statistics', () => {
      const summary = getViolationsSummary(mockViolations);

      expect(summary.total).toBe(4);
      expect(summary.severityCounts[SeverityEnum.Low]).toBe(1);
      expect(summary.severityCounts[SeverityEnum.Medium]).toBe(1);
      expect(summary.severityCounts[SeverityEnum.High]).toBe(1);
      expect(summary.severityCounts[SeverityEnum.Critical]).toBe(1);

      expect(summary.categoryCounts[CategoryEnum.PII]).toBe(2);
      expect(summary.categoryCounts[CategoryEnum.Bias]).toBe(1);
      expect(summary.categoryCounts[CategoryEnum.Security]).toBe(1);

      expect(summary.uniqueCategories).toHaveLength(3);
      expect(summary.uniqueSeverities).toHaveLength(4);
      expect(summary.hasHighSeverity).toBe(true);
      expect(summary.hasCriticalSeverity).toBe(true);
    });
  });
});
