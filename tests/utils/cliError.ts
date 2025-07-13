import { execSync } from 'child_process';
import { fail } from 'assert';

export function runCliCommandAndExpectError(
  command: string,
  expectedErrorPattern?: RegExp | string
) {
  try {
    execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    fail('Expected command to fail, but it succeeded');
  } catch (error: any) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      typeof (error as any).stderr === 'string'
    ) {
      const stderr = (error as any).stderr;
      if (expectedErrorPattern) {
        if (expectedErrorPattern instanceof RegExp) {
          expect(stderr).toMatch(expectedErrorPattern);
        } else {
          expect(stderr).toContain(expectedErrorPattern);
        }
      }
      return { stderr };
    } else {
      throw error;
    }
  }
} 