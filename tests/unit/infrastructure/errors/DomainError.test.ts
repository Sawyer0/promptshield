import { describe, test, expect } from '@jest/globals';
import { DomainError } from '../../../../src/infrastructure/errors/DomainError';

describe('DomainError', () => {
  describe('constructor', () => {
    test('should create error with message', () => {
      const error = new DomainError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('DomainError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    });

    test('should create error with message and code', () => {
      const error = new DomainError('Invalid input', 'INVALID_INPUT');

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.name).toBe('DomainError');
    });

    test('should create error with all parameters', () => {
      const context = { field: 'email', value: 'invalid-email' };
      const error = new DomainError(
        'Validation failed',
        'VALIDATION_ERROR',
        context
      );

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual(context);
    });

    test('should have proper stack trace', () => {
      const error = new DomainError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DomainError');
      expect(error.stack).toContain('Test error');
    });
  });

  describe('static factory methods', () => {
    test('should create validation error', () => {
      const error = DomainError.validation('Field is required', {
        field: 'name',
      });

      expect(error.message).toBe('Field is required');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({ field: 'name' });
    });

    test('should create not found error', () => {
      const error = DomainError.notFound('User not found', { userId: '123' });

      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.context).toEqual({ userId: '123' });
    });

    test('should create permission error', () => {
      const error = DomainError.permission('Access denied', {
        resource: 'admin',
      });

      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.context).toEqual({ resource: 'admin' });
    });

    test('should create configuration error', () => {
      const error = DomainError.configuration('Invalid config', {
        key: 'database.url',
      });

      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.context).toEqual({ key: 'database.url' });
    });

    test('should create processing error', () => {
      const error = DomainError.processing('Failed to process file', {
        file: 'test.json',
      });

      expect(error.message).toBe('Failed to process file');
      expect(error.code).toBe('PROCESSING_ERROR');
      expect(error.context).toEqual({ file: 'test.json' });
    });

    test('should create parsing error', () => {
      const error = DomainError.parsing('Invalid JSON', {
        line: 5,
        column: 10,
      });

      expect(error.message).toBe('Invalid JSON');
      expect(error.code).toBe('PARSING_ERROR');
      expect(error.context).toEqual({ line: 5, column: 10 });
    });
  });

  describe('methods', () => {
    test('should check if error has specific code', () => {
      const error = new DomainError('Test', 'VALIDATION_ERROR');

      expect(error.hasCode('VALIDATION_ERROR')).toBe(true);
      expect(error.hasCode('NOT_FOUND')).toBe(false);
    });

    test('should check if error has context', () => {
      const errorWithContext = new DomainError('Test', 'ERROR', {
        key: 'value',
      });
      const errorWithoutContext = new DomainError('Test', 'ERROR');

      expect(errorWithContext.hasContext()).toBe(true);
      expect(errorWithoutContext.hasContext()).toBe(false);
    });

    test('should get context value', () => {
      const error = new DomainError('Test', 'ERROR', {
        field: 'email',
        line: 10,
      });

      expect(error.getContext('field')).toBe('email');
      expect(error.getContext('line')).toBe(10);
      expect(error.getContext('nonexistent')).toBeUndefined();
    });

    test('should convert to JSON', () => {
      const error = new DomainError('Test error', 'TEST_ERROR', {
        key: 'value',
      });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'DomainError',
        message: 'Test error',
        code: 'TEST_ERROR',
        context: { key: 'value' },
        stack: error.stack,
      });
    });

    test('should create user-friendly message', () => {
      const error = new DomainError(
        'Field validation failed',
        'VALIDATION_ERROR',
        {
          field: 'email',
          value: 'invalid-email',
        }
      );

      const userMessage = error.toUserMessage();

      expect(userMessage).toContain('Field validation failed');
      expect(userMessage).not.toContain('VALIDATION_ERROR'); // Should not expose internal codes
    });

    test('should chain errors', () => {
      const originalError = new Error('Original error');
      const domainError = DomainError.processing('Processing failed', {
        step: 'validation',
      });

      const chainedError = domainError.withCause(originalError);

      expect(chainedError.cause).toBe(originalError);
      expect(chainedError.message).toBe('Processing failed');
    });
  });

  describe('error inheritance', () => {
    test('should work with instanceof checks', () => {
      const error = new DomainError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof DomainError).toBe(true);
    });

    test('should work with try-catch', () => {
      let caughtError: any;

      try {
        throw new DomainError('Test error', 'TEST_CODE');
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
      expect(caughtError.code).toBe('TEST_CODE');
    });
  });

  describe('serialization', () => {
    test('should serialize to JSON correctly', () => {
      const error = new DomainError('Test error', 'TEST_ERROR', {
        key: 'value',
      });
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.name).toBe('DomainError');
      expect(parsed.message).toBe('Test error');
      expect(parsed.code).toBe('TEST_ERROR');
      expect(parsed.context).toEqual({ key: 'value' });
    });

    test('should handle circular references in context', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const error = new DomainError('Test', 'ERROR', circular);

      expect(() => error.toJSON()).not.toThrow();
    });
  });

  describe('error patterns', () => {
    test('should support error chaining pattern', () => {
      const rootCause = new Error('Database connection failed');
      const domainError = DomainError.processing('User save failed')
        .withCause(rootCause)
        .withContext({ userId: '123', operation: 'save' });

      expect(domainError.cause).toBe(rootCause);
      expect(domainError.getContext('userId')).toBe('123');
      expect(domainError.getContext('operation')).toBe('save');
    });

    test('should support error wrapping pattern', () => {
      const originalError = new TypeError('Invalid argument');
      const wrappedError = DomainError.fromError(
        originalError,
        'PROCESSING_ERROR',
        {
          operation: 'scan',
          input: 'test.json',
        }
      );

      expect(wrappedError.message).toContain('Invalid argument');
      expect(wrappedError.code).toBe('PROCESSING_ERROR');
      expect(wrappedError.cause).toBe(originalError);
    });
  });
});







