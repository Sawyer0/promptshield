#!/usr/bin/env node

import { Command } from 'commander';
import { executeScanCommand } from './commands/scan';
import { executeUpdateCommand } from './commands/update';
import { ScanOptions } from './validators/options';

const program = new Command();

program
  .name('promptshield')
  .description('Scan prompts and responses for risky content')
  .version('1.0.0');

// --- Scan Command ---
program
  .command('scan <input>')
  .description('Scan a JSON file of prompts/responses')
  .option('--debug', 'Enable debug mode for detailed output')
  .option(
    '--fail-on <severity>',
    'Fail the scan on specified severity (low, medium, high, critical)'
  )
  .option('--rulepack <path>', 'Path to RulePack YAML')
  .option('--output <format>', 'Output format: json or markdown', 'markdown')
  .option('--output-file <file>', 'Write report to file instead of stdout')
  .option(
    '--fields <fields>',
    'Comma-separated list of fields to scan (default: prompt,response)'
  )
  .option('--scan-entire-object', 'Also scan the entire object as a string')
  .option(
    '--max-objects <number>',
    'Maximum number of objects to process (for large files)'
  )
  .option(
    '--ndjson',
    'Force NDJSON mode (treat input as newline-delimited JSON)'
  )
  .option(
    '--schema <schema>',
    'JSON schema to validate against (basic, extended, flexible, or custom schema file)'
  )
  .option('--compress <type>', 'Compress output file (gzip or deflate)')
  .option('--compression-level <level>', 'Compression level (0-9, default: 6)')
  .action(async (input: string, options: ScanOptions): Promise<void> => {
    await executeScanCommand(input, options);
  });

// --- Update Command ---
program
  .command('update')
  .description('Update the RulePacks')
  .action((): void => {
    executeUpdateCommand();
  });

program.parse();
