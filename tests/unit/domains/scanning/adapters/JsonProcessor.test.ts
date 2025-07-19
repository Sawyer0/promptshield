import { describe, test, expect } from '@jest/globals';
import { JsonProcessor } from '../../../../../src/domains/scanning/adapters/JsonProcessor';
import { createScanConfig } from '../../../../helpers/testFactories';
import { ScanContext } from '../../../../../src/domains/scanning/core/entities/ScanContext';

describe('JsonProcessor', () => {
  let processor: JsonProcessor;

  beforeEach(() => {
    processor = new JsonProcessor();
  });

  describe('canHandle', () => {
    test('should handle valid JSON objects', () => {
      expect(processor.canHandle('{"key": "value"}')).toBe(true);
      expect(processor.canHandle('{"nested": {"object": true}}')).toBe(true);
      expect(processor.canHandle('{}')).toBe(true);
    });

    test('should handle valid JSON arrays', () => {
      expect(processor.canHandle('[]')).toBe(true);
      expect(processor.canHandle('[1, 2, 3]')).toBe(true);
      expect(processor.canHandle('[{"item": 1}, {"item": 2}]')).toBe(true);
    });

    test('should handle valid JSON primitives', () => {
      expect(processor.canHandle('"string"')).toBe(true);
      expect(processor.canHandle('42')).toBe(true);
      expect(processor.canHandle('true')).toBe(true);
      expect(processor.canHandle('false')).toBe(true);
      expect(processor.canHandle('null')).toBe(true);
    });

    test('should handle NDJSON format', () => {
      expect(processor.canHandle('{"line": 1}\n{"line": 2}')).toBe(true);
      expect(processor.canHandle('{"a": 1}\n{"b": 2}\n{"c": 3}')).toBe(true);
    });

    test('should not handle invalid JSON', () => {
      expect(processor.canHandle('invalid json')).toBe(false);
      expect(processor.canHandle('{"incomplete": ')).toBe(false);
      expect(processor.canHandle('{key: "value"}')).toBe(false); // Unquoted key
      expect(processor.canHandle("{'single': 'quotes'}")).toBe(false);
    });

    test('should not handle plain text', () => {
      expect(processor.canHandle('This is plain text')).toBe(false);
      expect(processor.canHandle('Multiple\nlines\nof\ntext')).toBe(false);
      expect(processor.canHandle('')).toBe(false);
    });

    test('should handle JSON with whitespace', () => {
      expect(processor.canHandle('  \n  {"key": "value"}  \n  ')).toBe(true);
      expect(processor.canHandle('\t[\n\t{"item": 1}\n]')).toBe(true);
    });
  });

  describe('process - JSON Objects', () => {
    test('should process simple JSON object', async () => {
      const input = '{"prompt": "test", "response": "answer"}';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toEqual({ prompt: 'test', response: 'answer' });
    });

    test('should process nested JSON object', async () => {
      const input = JSON.stringify({
        conversation: {
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        },
        metadata: { timestamp: '2025-01-01' }
      });
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(1);
      expect(objects[0].conversation.messages).toHaveLength(2);
      expect(objects[0].metadata.timestamp).toBe('2025-01-01');
    });

    test('should process JSON array of objects', async () => {
      const input = JSON.stringify([
        { id: 1, text: 'First item' },
        { id: 2, text: 'Second item' },
        { id: 3, text: 'Third item' }
      ]);
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(3);
      expect(objects[0].id).toBe(1);
      expect(objects[1].text).toBe('Second item');
      expect(objects[2].id).toBe(3);
    });

    test('should process empty JSON object', async () => {
      const input = '{}';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toEqual({});
    });

    test('should process empty JSON array', async () => {
      const input = '[]';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(0);
    });
  });

  describe('process - NDJSON', () => {
    test('should process NDJSON with multiple lines', async () => {
      const input = '{"id": 1, "text": "First"}\n{"id": 2, "text": "Second"}\n{"id": 3, "text": "Third"}';
      const context = new ScanContext(createScanConfig({ ndjson: true }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(3);
      expect(objects[0].id).toBe(1);
      expect(objects[1].text).toBe('Second');
      expect(objects[2].id).toBe(3);
    });

    test('should process NDJSON with empty lines', async () => {
      const input = '{"id": 1}\n\n{"id": 2}\n\n\n{"id": 3}';
      const context = new ScanContext(createScanConfig({ ndjson: true }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(3);
      expect(objects.map(o => o.id)).toEqual([1, 2, 3]);
    });

    test('should process NDJSON with whitespace', async () => {
      const input = '  {"id": 1}  \n\t{"id": 2}\t\n   {"id": 3}   ';
      const context = new ScanContext(createScanConfig({ ndjson: true }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(3);
    });

    test('should handle single line NDJSON', async () => {
      const input = '{"single": "line"}';
      const context = new ScanContext(createScanConfig({ ndjson: true }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toEqual({ single: 'line' });
    });

    test('should auto-detect NDJSON format', async () => {
      const input = '{"line": 1}\n{"line": 2}';
      const context = new ScanContext(createScanConfig()); // ndjson not explicitly set

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(2);
    });
  });

  describe('field filtering', () => {
    test('should extract specified fields only', async () => {
      const input = JSON.stringify([
        { id: 1, prompt: 'Hello', response: 'Hi', metadata: { time: '10:00' } },
        { id: 2, prompt: 'How are you?', response: 'Good', metadata: { time: '10:01' } }
      ]);
      const context = new ScanContext(createScanConfig({
        fields: ['prompt', 'response']
      }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(2);
      expect(objects[0]).toEqual({ prompt: 'Hello', response: 'Hi' });
      expect(objects[1]).toEqual({ prompt: 'How are you?', response: 'Good' });
    });

    test('should handle nested field paths', async () => {
      const input = JSON.stringify([
        {
          conversation: {
            user: { message: 'Hello' },
            assistant: { message: 'Hi there' }
          },
          metadata: { timestamp: '2025-01-01' }
        }
      ]);
      const context = new ScanContext(createScanConfig({
        fields: ['conversation.user.message', 'conversation.assistant.message']
      }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toEqual({
        'conversation.user.message': 'Hello',
        'conversation.assistant.message': 'Hi there'
      });
    });

    test('should handle missing fields gracefully', async () => {
      const input = JSON.stringify([
        { prompt: 'Hello', response: 'Hi' },
        { prompt: 'How are you?' }, // Missing response
        { response: 'Fine' } // Missing prompt
      ]);
      const context = new ScanContext(createScanConfig({
        fields: ['prompt', 'response']
      }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(3);
      expect(objects[0]).toEqual({ prompt: 'Hello', response: 'Hi' });
      expect(objects[1]).toEqual({ prompt: 'How are you?' });
      expect(objects[2]).toEqual({ response: 'Fine' });
    });

    test('should scan entire object when scanEntireObject is true', async () => {
      const input = JSON.stringify([
        { prompt: 'Hello', response: 'Hi', metadata: { important: 'data' } }
      ]);
      const context = new ScanContext(createScanConfig({
        fields: ['prompt', 'response'],
        scanEntireObject: true
      }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects).toHaveLength(1);
      expect(objects[0]).toEqual({
        prompt: 'Hello',
        response: 'Hi',
        metadata: { important: 'data' }
      });
    });
  });

  describe('error handling', () => {
    test('should handle invalid JSON syntax', async () => {
      const input = '{"invalid": json}';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Invalid JSON');
    });

    test('should handle malformed NDJSON', async () => {
      const input = '{"valid": "json"}\n{invalid json}\n{"another": "valid"}';
      const context = new ScanContext(createScanConfig({ ndjson: true }));

      const result = await processor.process(input, context);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('line 2');
    });

    test('should handle truncated JSON', async () => {
      const input = '{"incomplete":';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Unexpected end');
    });

    test('should handle extremely large JSON objects', async () => {
      // Create a very large object that might cause memory issues
      const largeObject = {
        data: 'x'.repeat(100 * 1024 * 1024) // 100MB string
      };
      const input = JSON.stringify(largeObject);
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      // Should either succeed or fail gracefully with memory error
      if (result.isFailure()) {
        expect(result.getError()).toContain('memory');
      } else {
        expect(result.getValue()).toHaveLength(1);
      }
    });

    test('should handle circular references in input', async () => {
      // Note: JSON.stringify would normally throw on circular references
      // This tests the processor's robustness
      const input = '{"a": {"b": {"c": "circular simulation"}}}';
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('performance', () => {
    test('should process large arrays efficiently', async () => {
      const largeArray = Array(1000).fill(null).map((_, i) => ({
        id: i,
        prompt: `Prompt ${i}`,
        response: `Response ${i}`
      }));
      const input = JSON.stringify(largeArray);
      const context = new ScanContext(createScanConfig());

      const startTime = Date.now();
      const result = await processor.process(input, context);
      const endTime = Date.now();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should process large NDJSON efficiently', async () => {
      const lines = Array(1000).fill(null).map((_, i) =>
        JSON.stringify({ id: i, text: `Item ${i}` })
      );
      const input = lines.join('\n');
      const context = new ScanContext(createScanConfig({ ndjson: true }));

      const startTime = Date.now();
      const result = await processor.process(input, context);
      const endTime = Date.now();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle streaming threshold', async () => {
      const largeArray = Array(200).fill(null).map((_, i) => ({ id: i }));
      const input = JSON.stringify(largeArray);
      const context = new ScanContext(createScanConfig({
        streamingThreshold: 100
      }));

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveLength(200);
    });
  });

  describe('data types', () => {
    test('should preserve different JSON data types', async () => {
      const input = JSON.stringify({
        string: 'text',
        number: 42,
        float: 3.14,
        boolean: true,
        null_value: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      });
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects[0].string).toBe('text');
      expect(objects[0].number).toBe(42);
      expect(objects[0].float).toBe(3.14);
      expect(objects[0].boolean).toBe(true);
      expect(objects[0].null_value).toBeNull();
      expect(Array.isArray(objects[0].array)).toBe(true);
      expect(typeof objects[0].object).toBe('object');
    });

    test('should handle unicode and special characters', async () => {
      const input = JSON.stringify({
        unicode: '🚀 Unicode test: café, naïve, 中文, 日本語',
        escaped: 'Line 1\nLine 2\tTabbed',
        quotes: 'Single \' and double " quotes'
      });
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects[0].unicode).toContain('🚀');
      expect(objects[0].escaped).toContain('\n');
      expect(objects[0].quotes).toContain("'");
    });

    test('should handle very long strings', async () => {
      const longString = 'x'.repeat(10000);
      const input = JSON.stringify({ long_field: longString });
      const context = new ScanContext(createScanConfig());

      const result = await processor.process(input, context);

      expect(result.isSuccess()).toBe(true);
      const objects = result.getValue();
      expect(objects[0].long_field).toHaveLength(10000);
    });
  });
});
