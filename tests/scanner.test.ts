import { describe, test, expect } from '@jest/globals';
import Scanner from '../src/scanner';

describe('Scanner', () => {
  test('placeholder', () => {
    expect(true).toBe(true);
  });

  test('creates scanner instance', () => {
    const scanner = new Scanner();
    expect(scanner).toBeInstanceOf(Scanner);
  });
});
