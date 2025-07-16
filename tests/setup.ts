/**
 * Test Setup File
 * Configures the test environment and provides common utilities
 */

import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests

// Suppress console output during tests unless explicitly needed
beforeEach(() => {
  if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  }
});

afterEach(() => {
  if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
    jest.restoreAllMocks();
  }
});

// Global test utilities
global.testUtils = {
  // Wait for a specified time (useful for async tests)
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Create a mock file path
  createMockPath: (filename: string) => `/mock/path/${filename}`,

  // Generate test data
  generateTestData: (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `test-${i}`,
      prompt: `Test prompt ${i}`,
      response: `Test response ${i}`,
    })),

  // Mock process.exit
  mockProcessExit: () => {
    const originalExit = process.exit;
    const mockExit = jest.fn() as any;
    process.exit = mockExit;
    return {
      mockExit,
      restore: () => {
        process.exit = originalExit;
      },
    };
  },
};

// Type declarations for global test utilities
declare global {
  var testUtils: {
    wait: (ms: number) => Promise<void>;
    createMockPath: (filename: string) => string;
    generateTestData: (
      count: number
    ) => Array<{ id: string; prompt: string; response: string }>;
    mockProcessExit: () => { mockExit: jest.Mock; restore: () => void };
  };
}
