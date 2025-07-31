import { describe, test, expect } from '@jest/globals';
import { TextProcessor } from '../../../../../src/domains/scanning/adapters/TextProcessor';
import { createScanConfig } from '../../../../helpers/testFactories';
import { ScanContext } from '../../../../../src/domains/scanning/core/entities/ScanContext';

describe('TextProcessor', () => {
  let processor: TextProcessor;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  describe('canHandle', () => {
    test('should handle plain text', () => {
      expect(processor.canHandle('This is plain text')).toBe(true);
      expect(processor.canHandle('Multi\nline\ntext')).toBe(true);
      expect(processor.canHandle('Text with numbers 123 and symbols !@#')).toBe(
        true
      );
    });

    test('should handle empty string', () => {
      expect(processor.canHandle('')).toBe(true);
    });

    test('should handle text with special characters', () => {
      expect(processor.canHandle('Text with 🚀 emojis and café')).toBe(true);
      expect(processor.canHandle('中文 and 日本語 text')).toBe(true);
      expect(
        processor.canHandle('Text with "quotes" and \'apostrophes\'')
      ).toBe(true);
    });

    test('should not handle valid JSON objects', () => {
      expect(processor.canHandle('{"key": "value"}')).toBe(false);
      expect(processor.canHandle('{"nested": {"object": true}}')).toBe(false);
      expect(processor.canHandle('{}')).toBe(false);
    });

    test('should not handle valid JSON arrays', () => {
      expect(processor.canHandle('[]')).toBe(false);
      expect(processor.canHandle('[1, 2, 3]')).toBe(false);
      expect(processor.canHandle('[{"item": 1}]')).toBe(false);
    });

    test('should not handle JSON primitives', () => {
      expect(processor.canHandle('"string"')).toBe(false);
      expect(processor.canHandle('42')).toBe(false);
      expect(processor.canHandle('true')).toBe(false);
      expect(processor.canHandle('false')).toBe(false);
      expect(processor.canHandle('null')).toBe(false);
    });

    test('should not handle NDJSON format', () => {
      expect(processor.canHandle('{"line": 1}\n{"line": 2}')).toBe(false);
      expect(processor.canHandle('{"a": 1}\n{"b": 2}')).toBe(false);
    });

    test('should handle malformed JSON as text', () => {
      expect(processor.canHandle('invalid json {')).toBe(true);
      expect(processor.canHandle('{key: value}')).toBe(true);
      expect(processor.canHandle('almost json but not quite')).toBe(true);
    });

    test('should handle JSON-like text that is not valid JSON', () => {
      expect(processor.canHandle('This looks like {json: but} is not')).toBe(
        true
      );
      expect(processor.canHandle('Array-like [1, 2, but incomplete')).toBe(
        true
      );
    });
  });

  describe('process - basic text', () => {
    test('should process simple text as single item', async () => {
      const input = 'This is a simple text message';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0]).toBe(input);
    });

    test('should process empty text', async () => {
      const input = '';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0]).toBe('');
    });

    test('should process text with special characters', async () => {
      const input = 'Text with emojis 🚀🎉 and unicode café naïve 中文';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items[0]).toBe(input);
      expect(items[0]).toContain('🚀');
      expect(items[0]).toContain('café');
    });

    test('should process multiline text as single item', async () => {
      const input = 'Line 1\nLine 2\nLine 3\nLine 4';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0]).toBe(input);
      expect(items[0].split('\n')).toHaveLength(4);
    });

    test('should preserve whitespace and formatting', async () => {
      const input = '  Leading spaces\n\tTabbed line\n  \n  Trailing spaces  ';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items[0]).toBe(input);
      expect(items[0]).toMatch(/^  Leading/);
      expect(items[0]).toMatch(/spaces  $/);
    });
  });

  describe('process - line splitting', () => {
    test('should split text by lines when configured', async () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(3);
      expect(items[0]).toBe('Line 1');
      expect(items[1]).toBe('Line 2');
      expect(items[2]).toBe('Line 3');
    });

    test('should handle different line endings', async () => {
      const input = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(4);
      expect(items[0]).toBe('Line 1');
      expect(items[1]).toBe('Line 2');
      expect(items[2]).toBe('Line 3');
      expect(items[3]).toBe('Line 4');
    });

    test('should filter out empty lines when splitting', async () => {
      const input = 'Line 1\n\nLine 2\n\n\nLine 3\n';
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(3);
      expect(items).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });

    test('should preserve lines with only whitespace if configured', async () => {
      const input = 'Line 1\n  \nLine 2\n\t\nLine 3';
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
          preserveWhitespaceLines: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(5);
      expect(items[1]).toBe('  ');
      expect(items[3]).toBe('\t');
    });

    test('should handle single line text when splitting enabled', async () => {
      const input = 'Single line text without line breaks';
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0]).toBe(input);
    });
  });

  describe('process - paragraph splitting', () => {
    test('should split text by paragraphs', async () => {
      const input =
        'Paragraph 1\nContinuation of paragraph 1\n\nParagraph 2\nMore of paragraph 2\n\n\nParagraph 3';
      const context = new ScanContext(
        createScanConfig({
          splitByParagraphs: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(3);
      expect(items[0]).toBe('Paragraph 1\nContinuation of paragraph 1');
      expect(items[1]).toBe('Paragraph 2\nMore of paragraph 2');
      expect(items[2]).toBe('Paragraph 3');
    });

    test('should handle different paragraph separators', async () => {
      const input = 'Para 1\n\nPara 2\r\n\r\nPara 3\r\rPara 4';
      const context = new ScanContext(
        createScanConfig({
          splitByParagraphs: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(4);
    });

    test('should handle single paragraph', async () => {
      const input =
        'This is a single paragraph\nwith multiple lines\nbut no double line breaks';
      const context = new ScanContext(
        createScanConfig({
          splitByParagraphs: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(1);
      expect(items[0]).toBe(input);
    });
  });

  describe('process - sentence splitting', () => {
    test('should split text by sentences', async () => {
      const input =
        'First sentence. Second sentence! Third sentence? Fourth sentence.';
      const context = new ScanContext(
        createScanConfig({
          splitBySentences: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(4);
      expect(items[0]).toBe('First sentence.');
      expect(items[1]).toBe('Second sentence!');
      expect(items[2]).toBe('Third sentence?');
      expect(items[3]).toBe('Fourth sentence.');
    });

    test('should handle sentences with abbreviations', async () => {
      const input = 'Dr. Smith went to the U.S.A. He met Mr. Johnson.';
      const context = new ScanContext(
        createScanConfig({
          splitBySentences: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      // Should not split on abbreviations
      expect(items).toHaveLength(2);
      expect(items[0]).toContain('U.S.A.');
      expect(items[1]).toContain('Mr. Johnson.');
    });

    test('should handle sentences across multiple lines', async () => {
      const input =
        'This is a sentence\nthat spans multiple lines. This is\nanother sentence.';
      const context = new ScanContext(
        createScanConfig({
          splitBySentences: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      expect(items).toHaveLength(2);
    });
  });

  describe('process - configuration combinations', () => {
    test('should prioritize line splitting over other options', async () => {
      const input =
        'Line 1 with sentence. More text.\nLine 2 with sentence. More text.';
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
          splitBySentences: true,
        })
      );

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const items = result.getValue();
      // Should split by lines, not sentences
      expect(items).toHaveLength(2);
      expect(items[0]).toContain('Line 1');
      expect(items[1]).toContain('Line 2');
    });

    test('should handle complex text with all splitting options', async () => {
      const input =
        'Para 1 sent 1. Para 1 sent 2.\n\nPara 2 sent 1. Para 2 sent 2.\n\nPara 3 sent 1.';

      // Test paragraph splitting
      const paragraphContext = new ScanContext(
        createScanConfig({
          splitByParagraphs: true,
        })
      );
      const paragraphResult = await processor.process(input, paragraphContext);
      expect(paragraphResult.getValue()).toHaveLength(3);

      // Test sentence splitting
      const sentenceContext = new ScanContext(
        createScanConfig({
          splitBySentences: true,
        })
      );
      const sentenceResult = await processor.process(input, sentenceContext);
      expect(sentenceResult.getValue()).toHaveLength(5);
    });
  });

  describe('process - large text handling', () => {
    test('should handle very large text efficiently', async () => {
      const largeText = 'Lorem ipsum '.repeat(100000); // ~1MB of text
      const context = new ScanContext(createScanConfig());

      const startTime = Date.now();
      const result = await processor.process(largeText, context);
      const endTime = Date.now();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle large text with line splitting', async () => {
      const lines = Array(10000).fill('This is a test line');
      const largeText = lines.join('\n');
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
        })
      );

      const startTime = Date.now();
      const result = await processor.process(largeText, context);
      const endTime = Date.now();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle memory efficiently with streaming threshold', async () => {
      const largeText = 'x'.repeat(1024 * 1024); // 1MB text
      const context = new ScanContext(
        createScanConfig({
          streamingThreshold: 500 * 1024, // 500KB threshold
          splitByLines: false,
        })
      );

      const result = await processor.process(largeText, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    test('should handle null input gracefully', async () => {
      const input = null as any;
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Input must be a string');
    });

    test('should handle undefined input gracefully', async () => {
      const input = undefined as any;
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Input must be a string');
    });

    test('should handle non-string input gracefully', async () => {
      const input = 42 as any;
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Input must be a string');
    });

    test('should handle extremely long lines', async () => {
      const extremelyLongLine = 'x'.repeat(10 * 1024 * 1024); // 10MB single line
      const context = new ScanContext(
        createScanConfig({
          splitByLines: true,
        })
      );

      const result = await processor.process(extremelyLongLine, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0]).toHaveLength(10 * 1024 * 1024);
    });
  });

  describe('edge cases', () => {
    test('should handle text with only whitespace', async () => {
      const input = '   \n\t\n   \r\n   ';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0]).toBe(input);
    });

    test('should handle binary-like text content', async () => {
      const input =
        '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
    });

    test('should handle text with mixed encoding characters', async () => {
      const input =
        'ASCII text mixed with UTF-8: café 中文 🚀 and some escaped \\u0041\\u0042';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()[0]).toContain('café');
      expect(result.getValue()[0]).toContain('🚀');
    });

    test('should handle text that looks like structured data but is not', async () => {
      const input =
        'This text contains {curly braces} and [square brackets] and "quotes" but is not JSON';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0]).toBe(input);
    });

    test('should handle repetitive patterns', async () => {
      const input = 'repeat '.repeat(1000) + 'end';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0]).toEndWith('end');
    });
  });
});
