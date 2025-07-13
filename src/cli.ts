#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('promptshield')
  .description('ESLint for AI Safety - A developer-first CLI tool for scanning prompts and responses for risky content')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan files for AI safety issues')
  .argument('[files...]', 'Files to scan')
  .option('-r, --rules <path>', 'Path to rules directory')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action((files: string[], options: { rules?: string; output?: string }) => {
    console.log(chalk.blue('🔍 PromptShield Scanner'));
    console.log(chalk.gray('Scanning for AI safety issues...'));
    
    if (files.length === 0) {
      console.log(chalk.yellow('No files specified. Use --help for usage information.'));
      return;
    }
    
    console.log(chalk.green(`Found ${files.length} file(s) to scan`));
    console.log(chalk.gray(`Output format: ${options.output}`));
    console.log(chalk.gray('This is a placeholder implementation.'));
  });

program.parse();
