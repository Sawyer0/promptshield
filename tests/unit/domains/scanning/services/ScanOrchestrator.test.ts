import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DefaultScanOrchestrator } from '../../../../../src/domains/scanning/core/services/ScanOrchestrator';
import { FileReader } from '../../../../../src/domains/scanning/core/ports/FileReader';
import { ContentProcessor } from '../../../../../src/domains/scanning/core/ports/ContentProcessor';
import { RuleEngine } from '../../../../../src/domains/rules/core/ports/RuleEngine';
import {
  ScanStrategy,
  ScanMetricsCollector,
} from '../../../../../src/domains/scanning/core/ports/ScanEngine';
import {
  createScanRequest,
  createRulePack,
  createViolation,
  createScanMetrics,
} from '../../../../helpers/testFactories';
import { ok, err } from '../../../../../src/shared/types/Result';

describe('DefaultScanOrchestrator', () => {
  let orchestrator: DefaultScanOrchestrator;
  let mockFileReader: jest.Mocked<FileReader>;
  let mockProcessors: Map<string, jest.Mocked<ContentProcessor>>;
  let mockRuleEngine: jest.Mocked<RuleEngine>;
  let mockStrategy: jest.Mocked<ScanStrategy>;
  let mockMetricsCollector: jest.Mocked<ScanMetricsCollector>;

  beforeEach(() => {
    // Mock FileReader
    mockFileReader = {
      exists: jest.fn(),
      isDirectory: jest.fn(),
      listFiles: jest.fn(),
      readFile: jest.fn(),
      getFileSize: jest.fn(),
    } as jest.Mocked<FileReader>;

    // Mock ContentProcessors
    const mockJsonProcessor = {
      canProcess: jest.fn(),
      process: jest.fn(),
      getSupportedExtensions: jest.fn().mockReturnValue(['.json', '.ndjson']),
    } as jest.Mocked<ContentProcessor>;

    const mockTextProcessor = {
      canProcess: jest.fn(),
      process: jest.fn(),
      getSupportedExtensions: jest.fn().mockReturnValue(['.txt', '.md']),
    } as jest.Mocked<ContentProcessor>;

    mockProcessors = new Map([
      ['json', mockJsonProcessor],
      ['text', mockTextProcessor],
    ]);

    // Mock RuleEngine
    mockRuleEngine = {
      loadRulePack: jest.fn(),
      validateRulePack: jest.fn(),
      applyRules: jest.fn(),
      testRule: jest.fn(),
    } as jest.Mocked<RuleEngine>;

    // Mock ScanStrategy
    mockStrategy = {
      shouldUseStreaming: jest.fn(),
      shouldUseParallelProcessing: jest.fn(),
      getOptimalBatchSize: jest.fn(),
    } as jest.Mocked<ScanStrategy>;

    // Mock ScanMetricsCollector
    mockMetricsCollector = {
      start: jest.fn(),
      end: jest.fn(),
      recordProcessing: jest.fn(),
    } as jest.Mocked<ScanMetricsCollector>;

    orchestrator = new DefaultScanOrchestrator(
      mockFileReader,
      mockProcessors,
      mockRuleEngine,
      mockStrategy,
      mockMetricsCollector
    );
  });

  describe('scan', () => {
    test('should scan content successfully', async () => {
      const request = createScanRequest('test content');
      const rulePack = createRulePack();
      const violations = [createViolation()];
      const metrics = createScanMetrics();

      // Setup mocks
      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(false);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: 'test content',
            fields: { content: 'test content' },
            metadata: { index: 0, source: 'direct', type: 'text' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(ok(violations));
      mockMetricsCollector.end.mockReturnValue(metrics);

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations).toEqual(violations);
      expect(mockMetricsCollector.start).toHaveBeenCalled();
    });

    test('should handle file input', async () => {
      const request = createScanRequest('/path/to/file.txt');
      const rulePack = createRulePack();
      const fileContent = 'file content';
      const metrics = createScanMetrics();

      // Setup mocks
      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockFileReader.readFile.mockResolvedValue(ok(fileContent));
      mockFileReader.getFileSize.mockResolvedValue(ok(100));
      mockStrategy.shouldUseStreaming.mockReturnValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: fileContent,
            fields: { content: fileContent },
            metadata: { index: 0, source: '/path/to/file.txt', type: 'text' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(metrics);

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(mockFileReader.readFile).toHaveBeenCalledWith('/path/to/file.txt');
    });

    test('should handle directory input', async () => {
      const request = createScanRequest('/path/to/directory');
      const rulePack = createRulePack();
      const metrics = createScanMetrics();

      // Setup mocks
      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(true);
      mockFileReader.listFiles.mockResolvedValue(
        ok(['/path/to/directory/file1.txt'])
      );
      mockFileReader.readFile.mockResolvedValue(ok('content'));
      mockFileReader.getFileSize.mockResolvedValue(ok(50));
      mockStrategy.shouldUseStreaming.mockReturnValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: 'content',
            fields: { content: 'content' },
            metadata: { index: 0, source: 'file', type: 'text' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(metrics);

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(mockFileReader.listFiles).toHaveBeenCalledWith(
        '/path/to/directory'
      );
    });

    test('should use streaming for large files', async () => {
      const request = createScanRequest('/path/to/large-file.json');
      const rulePack = createRulePack();
      const fileContent = 'large content';
      const metrics = createScanMetrics({ streamingUsed: true });

      // Mock processor with streaming capability
      const streamingProcessor = {
        canProcess: jest.fn().mockReturnValue(true),
        process: jest.fn(),
        processStream: jest.fn().mockResolvedValue(ok(undefined)),
      };
      mockProcessors.set('json', streamingProcessor as any);

      // Setup mocks
      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockFileReader.readFile.mockResolvedValue(ok(fileContent));
      mockFileReader.getFileSize.mockResolvedValue(ok(10000)); // Large file
      mockStrategy.shouldUseStreaming.mockReturnValue(true);
      mockMetricsCollector.end.mockReturnValue(metrics);

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(streamingProcessor.processStream).toHaveBeenCalled();
      expect(result.value.metrics.streamingUsed).toBe(true);
    });
  });

  describe('validateRequest', () => {
    test('should validate valid request', () => {
      const request = createScanRequest('test input');

      const result = orchestrator.validateRequest(request);

      expect(result.isOk()).toBe(true);
    });

    test('should reject empty input', () => {
      const request = createScanRequest('');

      const result = orchestrator.validateRequest(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Input is required');
    });

    test('should reject whitespace-only input', () => {
      const request = createScanRequest('   \n\t  ');

      const result = orchestrator.validateRequest(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Input is required');
    });

    test('should reject request without config', () => {
      const request = createScanRequest('test');
      (request as any).config = null;

      const result = orchestrator.validateRequest(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Configuration is required');
    });
  });

  describe('createContext', () => {
    test('should create context successfully', async () => {
      const request = createScanRequest();
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));

      const result = await orchestrator.createContext(request);

      expect(result.isOk()).toBe(true);
      expect(result.value.config).toBe(request.config);
      expect(result.value.rulePack).toBe(rulePack);
    });

    test('should handle rulepack loading failure', async () => {
      const request = createScanRequest();
      const error = new Error('Failed to load rulepack');

      mockRuleEngine.loadRulePack.mockResolvedValue(err(error));

      const result = await orchestrator.createContext(request);

      expect(result.isErr()).toBe(true);
      expect(result.error).toBe(error);
    });

    test('should handle rulepack loading exception', async () => {
      const request = createScanRequest();

      mockRuleEngine.loadRulePack.mockRejectedValue(
        new Error('Loading exception')
      );

      const result = await orchestrator.createContext(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Failed to create scan context');
    });
  });

  describe('processor selection', () => {
    test('should find correct processor for JSON file', async () => {
      const request = createScanRequest('/path/to/file.json');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockFileReader.readFile.mockResolvedValue(ok('{}'));
      mockFileReader.getFileSize.mockResolvedValue(ok(100));
      mockStrategy.shouldUseStreaming.mockReturnValue(false);

      // JSON processor can handle .json files
      mockProcessors.get('json')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.canProcess.mockReturnValue(false);

      mockProcessors.get('json')!.process.mockResolvedValue(
        ok([
          {
            data: {},
            fields: { content: '{}' },
            metadata: { index: 0, source: '/path/to/file.json', type: 'json' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(createScanMetrics());

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(mockProcessors.get('json')!.process).toHaveBeenCalled();
      expect(mockProcessors.get('text')!.process).not.toHaveBeenCalled();
    });

    test('should handle no processor found', async () => {
      const request = createScanRequest('/path/to/unknown.xyz');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockFileReader.readFile.mockResolvedValue(ok('content'));
      mockFileReader.getFileSize.mockResolvedValue(ok(100));

      // No processor can handle this file type
      mockProcessors.get('json')!.canProcess.mockReturnValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(false);

      const result = await orchestrator.scan(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('No processor found for file');
    });

    test('should fallback to text processor for content', async () => {
      const request = createScanRequest('plain text content');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(false);
      mockFileReader.isDirectory.mockResolvedValue(false);

      // No specific processor, should use text as fallback
      mockProcessors.get('json')!.canProcess.mockReturnValue(false);

      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: 'plain text content',
            fields: { content: 'plain text content' },
            metadata: { index: 0, source: 'direct', type: 'text' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(createScanMetrics());

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(mockProcessors.get('text')!.process).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle file read errors', async () => {
      const request = createScanRequest('/nonexistent/file.txt');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockFileReader.readFile.mockResolvedValue(
        err(new Error('File not found'))
      );

      const result = await orchestrator.scan(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toBe('File not found');
    });

    test('should handle processor errors', async () => {
      const request = createScanRequest('test content');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(false);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors
        .get('text')!
        .process.mockResolvedValue(err(new Error('Processing failed')));

      const result = await orchestrator.scan(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toBe('Processing failed');
    });

    test('should handle rule engine errors', async () => {
      const request = createScanRequest('test content');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(false);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: 'test content',
            fields: { content: 'test content' },
            metadata: { index: 0, source: 'direct', type: 'text' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(
        err(new Error('Rule application failed'))
      );

      const result = await orchestrator.scan(request);

      expect(result.isErr()).toBe(true);
    });

    test('should handle orchestration exceptions', async () => {
      const request = createScanRequest('test content');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockRejectedValue(new Error('File system error'));

      const result = await orchestrator.scan(request);

      expect(result.isErr()).toBe(true);
      expect(result.error.message).toContain('Scan orchestration failed');
    });
  });

  describe('metrics collection', () => {
    test('should collect processing metrics', async () => {
      const request = createScanRequest('test content');
      const rulePack = createRulePack();
      const metrics = createScanMetrics({
        objectsScanned: 1,
        processingTime: 100,
        memoryUsage: 1024,
        rulesApplied: 5,
        streamingUsed: false,
      });

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(false);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: 'test content',
            fields: { content: 'test content' },
            metadata: { index: 0, source: 'direct', type: 'text' },
          },
        ])
      );
      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(metrics);

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics).toMatchObject({
        objectsScanned: 1,
        rulesApplied: 1, // enabledRules.length from rulePack
        streamingUsed: false,
      });
      expect(mockMetricsCollector.start).toHaveBeenCalled();
      expect(mockMetricsCollector.end).toHaveBeenCalled();
    });

    test('should track streaming metrics', async () => {
      const request = createScanRequest('/path/to/large-file.json');
      const rulePack = createRulePack();
      const metrics = createScanMetrics({ streamingUsed: true });

      // Mock streaming processor
      const streamingProcessor = {
        canProcess: jest.fn().mockReturnValue(true),
        process: jest.fn(),
        processStream: jest
          .fn()
          .mockImplementation(async (content, context, callback) => {
            await callback({
              data: 'chunk1',
              fields: { content: 'chunk1' },
              metadata: { index: 0, source: 'stream', type: 'json' },
            });
            await callback({
              data: 'chunk2',
              fields: { content: 'chunk2' },
              metadata: { index: 1, source: 'stream', type: 'json' },
            });
            return ok(undefined);
          }),
      };
      mockProcessors.set('json', streamingProcessor as any);

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(false);
      mockFileReader.readFile.mockResolvedValue(ok('large content'));
      mockFileReader.getFileSize.mockResolvedValue(ok(10000));
      mockStrategy.shouldUseStreaming.mockReturnValue(true);
      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(metrics);

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(result.value.metrics.streamingUsed).toBe(true);
      expect(mockMetricsCollector.recordProcessing).toHaveBeenCalledTimes(2);
    });
  });

  describe('complex scenarios', () => {
    test('should handle multiple files in directory', async () => {
      const request = createScanRequest('/path/to/directory');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(true);
      mockFileReader.isDirectory.mockResolvedValue(true);
      mockFileReader.listFiles.mockResolvedValue(
        ok(['/path/to/directory/file1.txt', '/path/to/directory/file2.json'])
      );
      mockFileReader.readFile.mockResolvedValue(ok('content'));
      mockFileReader.getFileSize.mockResolvedValue(ok(100));
      mockStrategy.shouldUseStreaming.mockReturnValue(false);

      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('json')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: 'content',
            fields: { content: 'content' },
            metadata: { index: 0, source: 'file', type: 'text' },
          },
        ])
      );
      mockProcessors.get('json')!.process.mockResolvedValue(
        ok([
          {
            data: 'content',
            fields: { content: 'content' },
            metadata: { index: 0, source: 'file', type: 'text' },
          },
        ])
      );

      mockRuleEngine.applyRules.mockResolvedValue(ok([createViolation()]));
      mockMetricsCollector.end.mockReturnValue(
        createScanMetrics({ objectsScanned: 2 })
      );

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(result.value.violations).toHaveLength(2); // One violation per file
      expect(result.value.metrics.objectsScanned).toBe(2);
    });

    test('should handle mixed content types', async () => {
      const request = createScanRequest('{"json": true} and plain text');
      const rulePack = createRulePack();

      mockRuleEngine.loadRulePack.mockResolvedValue(ok(rulePack));
      mockFileReader.exists.mockResolvedValue(false);
      mockFileReader.isDirectory.mockResolvedValue(false);

      // First processor (JSON) can't handle mixed content
      mockProcessors.get('json')!.canProcess.mockReturnValue(false);
      // Text processor handles it
      mockProcessors.get('text')!.canProcess.mockReturnValue(true);
      mockProcessors.get('text')!.process.mockResolvedValue(
        ok([
          {
            data: '{"json": true} and plain text',
            fields: { content: '{"json": true} and plain text' },
            metadata: { index: 0, source: 'direct', type: 'text' },
          },
        ])
      );

      mockRuleEngine.applyRules.mockResolvedValue(ok([]));
      mockMetricsCollector.end.mockReturnValue(createScanMetrics());

      const result = await orchestrator.scan(request);

      expect(result.isOk()).toBe(true);
      expect(mockProcessors.get('text')!.process).toHaveBeenCalled();
    });
  });
});
