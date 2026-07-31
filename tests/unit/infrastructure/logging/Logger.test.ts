import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Logger } from '../../../../src/infrastructure/logging/Logger';

describe('Logger', () => {
  let logger: Logger;
  let mockConsole: {
    log: jest.MockedFunction<typeof console.log>;
    error: jest.MockedFunction<typeof console.error>;
    warn: jest.MockedFunction<typeof console.warn>;
    debug: jest.MockedFunction<typeof console.debug>;
  };

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    // Replace console methods
    global.console.log = mockConsole.log;
    global.console.error = mockConsole.error;
    global.console.warn = mockConsole.warn;
    global.console.debug = mockConsole.debug;

    logger = new Logger();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('info', () => {
    test('should log info messages', () => {
      logger.info('Test info message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Test info message'
      );
    });

    test('should log info with context', () => {
      logger.info('User action', { userId: '123', action: 'login' });

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'User action',
        { userId: '123', action: 'login' }
      );
    });
  });

  describe('error', () => {
    test('should log error messages', () => {
      logger.error('Test error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Test error message'
      );
    });

    test('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Operation failed',
        error
      );
    });

    test('should log error with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Failed operation', { error, context: 'test' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Failed operation',
        { error, context: 'test' }
      );
    });
  });

  describe('warn', () => {
    test('should log warning messages', () => {
      logger.warn('Test warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Test warning message'
      );
    });

    test('should log warning with metadata', () => {
      logger.warn('Performance warning', {
        processingTime: 5000,
        threshold: 3000,
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Performance warning',
        { processingTime: 5000, threshold: 3000 }
      );
    });
  });

  describe('debug', () => {
    test('should log debug messages when debug enabled', () => {
      const debugLogger = new Logger({ level: 'debug' });
      debugLogger.debug('Test debug message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Test debug message'
      );
    });

    test('should not log debug messages when debug disabled', () => {
      const prodLogger = new Logger({ level: 'info' });
      prodLogger.debug('Test debug message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    test('should log debug with detailed context', () => {
      const debugLogger = new Logger({ level: 'debug' });
      debugLogger.debug('Processing step', {
        step: 'validation',
        input: 'test.yaml',
        rules: 5,
      });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Processing step',
        { step: 'validation', input: 'test.yaml', rules: 5 }
      );
    });
  });

  describe('log levels', () => {
    test('should respect log level hierarchy', () => {
      const errorOnlyLogger = new Logger({ level: 'error' });

      errorOnlyLogger.debug('Debug message');
      errorOnlyLogger.info('Info message');
      errorOnlyLogger.warn('Warn message');
      errorOnlyLogger.error('Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    test('should log all levels when set to debug', () => {
      const debugLogger = new Logger({ level: 'debug' });

      debugLogger.debug('Debug message');
      debugLogger.info('Info message');
      debugLogger.warn('Warn message');
      debugLogger.error('Error message');

      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('formatting', () => {
    test('should include timestamp in log output', () => {
      logger.info('Test message');

      const call = mockConsole.log.mock.calls[0][0];
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
    });

    test('should format messages consistently', () => {
      logger.info('Test message');

      const call = mockConsole.log.mock.calls[0][0];
      expect(call).toContain('[INFO]');
      expect(call).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z \[INFO\]$/
      );
    });

    test('should handle objects and arrays in context', () => {
      const complexContext = {
        array: [1, 2, 3],
        object: { nested: true },
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
      };

      logger.info('Complex context', complexContext);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.any(String),
        'Complex context',
        complexContext
      );
    });
  });

  describe('child loggers', () => {
    test('should create child logger with context', () => {
      const childLogger = logger.child({ component: 'scanner' });
      childLogger.info('Scanning started');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Scanning started',
        { component: 'scanner' }
      );
    });

    test('should merge child context with log context', () => {
      const childLogger = logger.child({ component: 'scanner' });
      childLogger.info('Processing file', { file: 'test.json' });

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Processing file',
        { component: 'scanner', file: 'test.json' }
      );
    });
  });

  describe('error handling', () => {
    test('should handle logging failures gracefully', () => {
      // Make console.log throw an error
      mockConsole.log.mockImplementation(() => {
        throw new Error('Console error');
      });

      // Should not throw
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });

    test('should handle circular references in context', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        logger.info('Circular reference test', circular);
      }).not.toThrow();
    });
  });

  describe('configuration', () => {
    test('should accept custom format', () => {
      const customLogger = new Logger({
        level: 'info',
        format: 'json',
      });

      customLogger.info('Test message', { key: 'value' });

      expect(mockConsole.log).toHaveBeenCalled();
      const loggedData = mockConsole.log.mock.calls[0][0];
      expect(() => JSON.parse(loggedData)).not.toThrow();
    });

    test('should support silent mode', () => {
      const silentLogger = new Logger({ level: 'silent' });

      silentLogger.error('Error message');
      silentLogger.warn('Warning message');
      silentLogger.info('Info message');
      silentLogger.debug('Debug message');

      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });
});







