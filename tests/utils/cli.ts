import { execSync } from 'child_process';
import { fail } from 'assert';

export type CliResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: Error;
};

/**
 * Runs a CLI command and captures stdout, stderr, and any thrown error.
 * Always returns a structured result for predictable testing.
 */
export function runCliCommand(command: string): CliResult {
  try {
    const stdout = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return {
      success: true,
      stdout,
      stderr: '',
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? error.message ?? '',
      error,
    };
  }
}
