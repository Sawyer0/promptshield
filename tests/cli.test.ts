import { runCliCommand } from './utils/cli';
import { runCliCommandAndExpectError } from './utils/cliError';

describe('CLI', () => {
  test('--help shows usage', () => {
    const result = runCliCommand('node bin/promptshield --help');
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('promptshield');
    expect(result.stdout).toContain('Scan prompts and responses');
  });

  test('--version shows version', () => {
    const result = runCliCommand('node bin/promptshield --version');
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('1.0.0');
  });

  test('invalid command shows error', () => {
    const { stderr } = runCliCommandAndExpectError('node bin/promptshield invalid', /unknown command/i);
    expect(stderr).toMatch(/unknown command/i);
  });
});
