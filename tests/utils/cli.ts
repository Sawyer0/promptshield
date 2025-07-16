import { spawnSync } from 'child_process';

export type CliResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: Error;
};

/**
 * Strips ANSI color codes from a string
 */
export function stripAnsiCodes(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Extracts the first JSON object or array from CLI output (ignores summary/status lines)
 */
export function extractJsonBlock(output: string): string {
  const firstBrace = output.indexOf('{');
  const firstBracket = output.indexOf('[');
  let start = -1;
  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error('No JSON found in output');
  } else if (firstBrace === -1) {
    start = firstBracket;
  } else if (firstBracket === -1) {
    start = firstBrace;
  } else {
    start = Math.min(firstBrace, firstBracket);
  }
  return output.slice(start);
}

/**
 * Runs a CLI command and captures stdout, stderr, and any thrown error.
 * Always returns a structured result for predictable testing.
 */
export function runCliCommand(command: string): CliResult {
  const args = command.split(' ');
  const cmd = args[0];
  const cmdArgs = args.slice(1);

  const result = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return {
    success: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    error:
      result.status !== 0
        ? new Error(result.stderr || 'Command failed')
        : undefined,
  };
}
