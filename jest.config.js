/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '/tests/.*\\.(test|spec)\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // Parallel execution settings (conservative defaults)
  maxWorkers: 2, // Use 2 workers for moderate CPU usage
  maxConcurrency: 3, // Reduce concurrent tests for stability

  // Performance optimizations
  bail: false, // Don't stop on first failure
  verbose: false, // Reduce noise in output

  // Test timeout
  testTimeout: 30000, // 30 seconds per test

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },

  // Test setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module name mapping for better imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
};
