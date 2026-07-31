import { describe, it, expect } from '@jest/globals';
import { applyRulesToDataOrStream } from '../../src/domains/scanning/core/services/ScanOrchestrator';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Comprehensive Test Fixtures', () => {
  describe('No Matches Testing', () => {
    it('should return no violations for clean content', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/no-matches.json'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations).toHaveLength(0);
    });

    it('should handle NDJSON with no violations', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/no-matches.ndjson'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      );

      expect(results[0].violations).toHaveLength(0);
    });
  });

  describe('Multiple Severities Testing', () => {
    it('should detect violations of different severity levels', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/multiple-severities.json'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations.length).toBeGreaterThan(0);

      const severities = results[0].violations.map((v) => v.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
      expect(severities).toContain('low');
    });

    it('should detect violations of different severity levels', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/multiple-severities.json'),
        'utf8'
      );

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations.length).toBeGreaterThan(0);

      // Check that we have violations of different severities
      const severities = results[0].violations.map((v) => v.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
    });

    it('should handle NDJSON with multiple severities', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/multiple-severities.ndjson'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      );

      expect(results[0].violations.length).toBeGreaterThan(0);
      const severities = results[0].violations.map((v) => v.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
      expect(severities).toContain('low');
    });
  });

  describe('Multiple Categories Testing', () => {
    it('should detect violations across different categories', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/multiple-categories.json'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations.length).toBeGreaterThan(0);

      // Should detect PII violations
      const piiViolations = results[0].violations.filter(
        (v) => v.category === 'pii'
      );
      expect(piiViolations.length).toBeGreaterThan(0);
    });

    it('should detect violations across different categories', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/multiple-categories.json'),
        'utf8'
      );

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations.length).toBeGreaterThan(0);

      // Check that we have PII violations
      const piiViolations = results[0].violations.filter(
        (v) => v.category === 'pii'
      );
      expect(piiViolations.length).toBeGreaterThan(0);
    });

    it('should handle NDJSON with multiple categories', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/multiple-categories.ndjson'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      );

      expect(results[0].violations.length).toBeGreaterThan(0);
    });
  });

  describe('Large Result Sets Testing', () => {
    it('should handle large datasets efficiently', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.json'),
        'utf8'
      );
      const startTime = Date.now();

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );
      const endTime = Date.now();

      expect(results[0].violations.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large datasets efficiently', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.json'),
        'utf8'
      );

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations.length).toBeGreaterThan(0);
    });

    it('should handle large datasets with multiple violations', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.json'),
        'utf8'
      );

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations.length).toBeGreaterThan(0);
    });

    it('should handle NDJSON streaming for large datasets', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.ndjson'),
        'utf8'
      );
      const startTime = Date.now();

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      );

      const endTime = Date.now();

      expect(results[0].violations.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(3000); // Should be faster than JSON
    });

    it('should handle NDJSON streaming efficiently', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.ndjson'),
        'utf8'
      );

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      );

      expect(results[0].violations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Testing', () => {
    it('should handle memory efficiently with large files', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.json'),
        'utf8'
      );
      const initialMemory = process.memoryUsage().heapUsed;

      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(results[0].violations.length).toBeGreaterThan(0);
    });

    it('should handle concurrent scanning efficiently', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/large-result-set.json'),
        'utf8'
      );

      const promises = Array(5)
        .fill(null)
        .map(() =>
          applyRulesToDataOrStream(content, 'rulepacks/pii.yaml', true)
        );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result[0].violations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/malformed.json'),
        'utf8'
      );

      await expect(
        applyRulesToDataOrStream(content, 'rulepacks/pii.yaml', true)
      ).rejects.toThrow();
    });

    it('should handle malformed NDJSON gracefully', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/malformed.ndjson'),
        'utf8'
      );

      await expect(
        applyRulesToDataOrStream(content, 'rulepacks/pii.yaml', true, false, {
          ndjsonMode: true,
        })
      ).rejects.toThrow();
    });

    it('should handle empty files', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/empty.json'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true
      );

      expect(results[0].violations).toHaveLength(0);
    });

    it('should handle empty NDJSON files', async () => {
      const content = readFileSync(
        join(__dirname, '../fixtures/empty.ndjson'),
        'utf8'
      );
      const results = await applyRulesToDataOrStream(
        content,
        'rulepacks/pii.yaml',
        true,
        false,
        { ndjsonMode: true }
      );

      expect(results[0].violations).toHaveLength(0);
    });
  });
});







