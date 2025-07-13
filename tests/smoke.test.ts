import { describe, test, expect } from '@jest/globals';

describe('Smoke Tests', () => {
  test('smoke test', () => {
    expect(true).toBe(true);
  });

  test('basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  test('string operations', () => {
    expect('hello' + ' world').toBe('hello world');
  });
});