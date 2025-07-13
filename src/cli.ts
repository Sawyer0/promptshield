#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const { blue, gray, yellow, green, red } = chalk;
const program = new Command();

program
  .name('promptshield')
  .description('Scan prompts and responses for risky content')
  .version('1.0.0');

// --- Scan Command ---
program
  .command('scan')
  .description('Scan files for AI safety issues')
  .argument('<files...>', 'Files to scan')
  .option('-r, --rules <path>', 'Path to rules directory')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(
    (files: string[], options: { rules?: string; output: string }): void => {
      try {
        console.log(blue('🛡️  PromptShield Scanner'));
        console.log(gray('Scanning for AI safety issues...'));

        if (files.length === 0) {
          console.log(
            yellow(
              'Warning: No files specified. Use --help for usage information.'
            )
          );
          throw new Error('No files specified.');
        }

        console.log(green(`Found ${files.length} file(s) to scan`));
        console.log(gray(`Output format: ${options.output}`));
        console.log(gray('This is a placeholder implementation.'));
      } catch (error) {
        console.error(red(`Error: ${(error as Error).message}`));
      }
    }
  );

// --- Update Command ---
program
  .command('update')
  .description('Update the RulePacks')
  .action(() => {
    try {
      console.log(blue('🔄 Updating RulePacks...'));
      console.log(gray('This is a placeholder implementation.'));
    } catch (error) {
      console.error(red(`Error: ${(error as Error).message}`));
    }
  });

program.parse();
