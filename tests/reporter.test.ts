import { describe, test, expect } from '@jest/globals';
import Reporter from '../src/reporter';

describe('Reporter', () => {
  test('placeholder', () => {
    expect(true).toBe(true);
  });

  test('creates reporter instance', () => {
    const reporter = new Reporter();
    expect(reporter).toBeInstanceOf(Reporter);
  });
});
