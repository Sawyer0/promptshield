/**
 * Unit tests for output renderers
 */

import { rendererRegistry } from '../../src/core/renderers';
import { MetadataBuilder } from '../../src/core/renderers/metadataBuilder';
import { ScanResult } from '../../src/types/core/rule';
import { OutputFormat } from '../../src/types/core/outputFormat';

describe('Output Renderers', () => {
  const mockResults: ScanResult[] = [
    {
      file: 'test.json',
      violations: [
        {
          ruleId: 'test-rule-1',
          severity: 'high',
          category: 'pii',
          message: 'Potential PII detected',
          match: 'john.doe@example.com',
          objectIndex: 0,
          field: 'email',
          filePath: 'test.json',
        },
        {
          ruleId: 'test-rule-2',
          severity: 'medium',
          category: 'bias',
          message: 'Potential bias detected',
          match: 'biased text',
          lineNumber: 15,
          filePath: 'test.json',
        },
      ],
      durationMs: 42,
    },
  ];

  describe('RendererRegistry', () => {
    it('should support all expected formats', () => {
      const formats = rendererRegistry.getAvailableFormats();
      expect(formats).toContain('json');
      expect(formats).toContain('markdown');
      expect(formats).toContain('csv');
      expect(formats).toContain('table');
      expect(formats).toContain('html');
    });

    it('should get renderer for valid format', () => {
      const renderer = rendererRegistry.getRenderer('json');
      expect(renderer).toBeDefined();
      expect(renderer.getExtension()).toBe('.json');
      expect(renderer.getMimeType()).toBe('application/json');
    });

    it('should throw error for invalid format', () => {
      expect(() => {
        rendererRegistry.getRenderer('invalid' as OutputFormat);
      }).toThrow('Unsupported output format');
    });

    it('should check if format is supported', () => {
      expect(rendererRegistry.isSupported('json')).toBe(true);
      expect(rendererRegistry.isSupported('invalid')).toBe(false);
    });
  });

  describe('MetadataBuilder', () => {
    it('should build metadata from scan results', () => {
      const metadata = MetadataBuilder.buildMetadata(mockResults);

      expect(metadata.scanDate).toBeDefined();
      expect(metadata.fileCount).toBe(1);
      expect(metadata.totalViolations).toBe(2);
      expect(metadata.severityBreakdown.high).toBe(1);
      expect(metadata.severityBreakdown.medium).toBe(1);
      expect(metadata.categoryBreakdown.pii).toBe(1);
      expect(metadata.categoryBreakdown.bias).toBe(1);
    });

    it('should build context with options', () => {
      const context = MetadataBuilder.buildContext(
        mockResults,
        {
          rulepack: 'test-rules.yaml',
          filters: {
            severity: ['high', 'medium'],
            category: ['pii'],
          },
          options: {
            maxViolations: 10,
            offset: 0,
            limit: 100,
          },
        },
        {
          noColor: true,
          verbose: true,
          quiet: false,
        }
      );

      expect(context.metadata.rulepack).toBe('test-rules.yaml');
      expect(context.metadata.filters?.severity).toEqual(['high', 'medium']);
      expect(context.metadata.filters?.category).toEqual(['pii']);
      expect(context.metadata.options?.maxViolations).toBe(10);
      expect(context.options.noColor).toBe(true);
      expect(context.options.verbose).toBe(true);
    });

    it('should get severity weights', () => {
      expect(MetadataBuilder.getSeverityWeight('critical')).toBe(4);
      expect(MetadataBuilder.getSeverityWeight('high')).toBe(3);
      expect(MetadataBuilder.getSeverityWeight('medium')).toBe(2);
      expect(MetadataBuilder.getSeverityWeight('low')).toBe(1);
      expect(MetadataBuilder.getSeverityWeight('unknown')).toBe(0);
    });

    it('should sort violations by severity', () => {
      const violations = [
        {
          ruleId: 'test-1',
          message: 'Test violation 1',
          match: 'test1',
          severity: 'low' as const,
          category: 'pii' as const,
          filePath: 'test.json',
        },
        {
          ruleId: 'test-2',
          message: 'Test violation 2',
          match: 'test2',
          severity: 'critical' as const,
          category: 'bias' as const,
          filePath: 'test.json',
        },
        {
          ruleId: 'test-3',
          message: 'Test violation 3',
          match: 'test3',
          severity: 'medium' as const,
          category: 'security' as const,
          filePath: 'test.json',
        },
        {
          ruleId: 'test-4',
          message: 'Test violation 4',
          match: 'test4',
          severity: 'high' as const,
          category: 'compliance' as const,
          filePath: 'test.json',
        },
      ];

      const sorted = MetadataBuilder.sortViolationsBySeverity(violations);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('high');
      expect(sorted[2].severity).toBe('medium');
      expect(sorted[3].severity).toBe('low');
    });
  });

  describe('Individual Renderers', () => {
    it('should render JSON output', () => {
      const renderer = rendererRegistry.getRenderer('json');
      const context = MetadataBuilder.buildContext(mockResults);
      const output = renderer.render(mockResults, context);

      expect(output).toContain('"metadata"');
      expect(output).toContain('"results"');
      expect(output).toContain('"summary"');
      expect(output).toContain('"test-rule-1"');
      expect(output).toContain('"high"');
    });

    it('should render Markdown output', () => {
      const renderer = rendererRegistry.getRenderer('markdown');
      const context = MetadataBuilder.buildContext(mockResults);
      const output = renderer.render(mockResults, context);

      expect(output).toContain('# PromptShield Scan Report');
      expect(output).toContain('## Summary');
      expect(output).toContain('## Results');
      expect(output).toContain('test-rule-1');
      expect(output).toContain('high');
    });

    it('should render CSV output', () => {
      const renderer = rendererRegistry.getRenderer('csv');
      const context = MetadataBuilder.buildContext(mockResults);
      const output = renderer.render(mockResults, context);

      expect(output).toContain('File,Rule ID,Severity,Category,Message,Match');
      expect(output).toContain('test.json');
      expect(output).toContain('test-rule-1');
      expect(output).toContain('high');
    });

    it('should render Table output', () => {
      const renderer = rendererRegistry.getRenderer('table');
      const context = MetadataBuilder.buildContext(mockResults);
      const output = renderer.render(mockResults, context);

      expect(output).toContain('PromptShield Scan Report');
      expect(output).toContain('Summary:');
      expect(output).toContain('Results:');
      expect(output).toContain('test-rule-1');
    });

    it('should render HTML output', () => {
      const renderer = rendererRegistry.getRenderer('html');
      const context = MetadataBuilder.buildContext(mockResults);
      const output = renderer.render(mockResults, context);

      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('<title>PromptShield Scan Report</title>');
      expect(output).toContain('test-rule-1');
      expect(output).toContain('high');
    });
  });

  describe('Renderer Properties', () => {
    it('should have correct extensions', () => {
      expect(rendererRegistry.getRenderer('json').getExtension()).toBe('.json');
      expect(rendererRegistry.getRenderer('markdown').getExtension()).toBe(
        '.md'
      );
      expect(rendererRegistry.getRenderer('csv').getExtension()).toBe('.csv');
      expect(rendererRegistry.getRenderer('table').getExtension()).toBe('.txt');
      expect(rendererRegistry.getRenderer('html').getExtension()).toBe('.html');
    });

    it('should have correct MIME types', () => {
      expect(rendererRegistry.getRenderer('json').getMimeType()).toBe(
        'application/json'
      );
      expect(rendererRegistry.getRenderer('markdown').getMimeType()).toBe(
        'text/markdown'
      );
      expect(rendererRegistry.getRenderer('csv').getMimeType()).toBe(
        'text/csv'
      );
      expect(rendererRegistry.getRenderer('table').getMimeType()).toBe(
        'text/plain'
      );
      expect(rendererRegistry.getRenderer('html').getMimeType()).toBe(
        'text/html'
      );
    });

    it('should support streaming appropriately', () => {
      expect(rendererRegistry.getRenderer('json').supportsStreaming()).toBe(
        false
      );
      expect(rendererRegistry.getRenderer('markdown').supportsStreaming()).toBe(
        true
      );
      expect(rendererRegistry.getRenderer('csv').supportsStreaming()).toBe(
        true
      );
      expect(rendererRegistry.getRenderer('table').supportsStreaming()).toBe(
        true
      );
      expect(rendererRegistry.getRenderer('html').supportsStreaming()).toBe(
        false
      );
    });
  });
});
