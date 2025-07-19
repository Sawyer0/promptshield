#!/usr/bin/env node

// OLD CLI - COMMENTED OUT FOR NEW ARCHITECTURE TESTING
/*
import { Command } from 'commander';
import { executeScanCommand } from './commands/scan';
// import { executeUpdateCommand } from './commands/update'; // Disabled for v1.0.0
import { executeValidateCommand } from './commands/validate';
import { executeListCommand } from './commands/list';
import { executeCreateCommand } from './commands/create';
import { executeTestCommand } from './commands/test';
import { executeInitCommand } from './commands/init';
import { ScanOptions } from './validators/options';
// import { UpdateOptions } from './commands/update/types'; // Disabled for v1.0.0
import { CreateOptions } from './commands/create/types';
import { TestOptions } from './commands/test/types';
import { InitOptions } from './commands/init/types';

const program = new Command();

program
  .name('promptshield')
  .description('Scan prompts and responses for risky content')
  .version('1.0.0');

// --- Scan Command ---
program
  .command('scan <input>')
  .description(
    'Scan a JSON file of prompts/responses (supports streaming output for NDJSON, Markdown, and CSV when writing to a file for large result sets. Streaming improves performance and memory usage. Order may not be fully preserved; truncation warnings will be shown if limits are hit.)'
  )
  .option('--debug', 'Enable debug mode for detailed output')
  .option(
    '--fail-on <severity>',
    'Fail the scan on specified severity (low, medium, high, critical)'
  )
  .option('--rulepack <path>', 'Path to RulePack YAML')
  .option(
    '--output <format>',
    'Output format: json, markdown, csv, table, html, or ndjson (default: markdown). NDJSON, Markdown, and CSV support streaming output to files for large results.'
  )
  .option('--output-file <file>', 'Write report to file instead of stdout')
  .option(
    '--severity <levels>',
    'Filter by severity levels (comma-separated: low,medium,high,critical)'
  )
  .option(
    '--category <categories>',
    'Filter by categories (comma-separated: pii,bias,hallucination,security,compliance)'
  )
  .option(
    '--max-violations <number>',
    'Maximum number of violations to report (for large result sets, may truncate output and show a warning)'
  )
  .option('--offset <number>', 'Offset for pagination (default: 0)')
  .option(
    '--limit <number>',
    'Limit for pagination (default: all, may truncate output and show a warning)'
  )
  .option('--quiet', 'Suppress progress output and summary')
  .option('--verbose', 'Enable verbose output with detailed information')
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
  .option('--no-color', 'Disable colored output')
  .option('--strict', 'Enable strict mode (treat warnings as errors)')
  .option(
    '--timeout <seconds>',
    'Timeout for processing large files (default: 300)'
  )
  .option(
    '--max-depth <number>',
    'Maximum depth for nested object traversal (default: 4)'
  )
  .option(
    '--streaming-threshold <number>',
    'Threshold for switching to streaming mode for large JSON arrays (default: 1000)'
  )
  .option(
    '--memory-warning-threshold <number>',
    'Memory usage threshold (0.0-1.0) for warnings during large scans (default: 0.8)'
  )
  .option(
    '--parallel [workers]',
    'Enable parallel scanning (optional: specify number of workers, default: CPU cores)'
  )
  .option(
    '--batch-size <number>',
    'Batch size for parallel processing (default: 10)'
  )
  .action(async (input: string, options: ScanOptions): Promise<void> => {
    await executeScanCommand(input, options);
  });

// --- Update Command (Disabled for v1.0.0 - functionality preserved for future use) ---
// program
//   .command('update')
//   .description('Update the RulePacks')
//   .option('--force', 'Force update even if no changes detected')
//   .option('--registry <url>', 'Custom registry URL for RulePacks')
//   .action(async (options: UpdateOptions): Promise<void> => {
//     await executeUpdateCommand(options);
//   });

// --- Validate Command ---
program
  .command('validate <input>')
  .description('Validate input file format and structure')
  .option('--schema <schema>', 'JSON schema to validate against')
  .option('--rulepack <path>', 'Validate against specific RulePack')
  .option('--output <format>', 'Output format: json or text', 'text')
  .action(async (input: string, options: ScanOptions): Promise<void> => {
    await executeValidateCommand(input, options);
  });

// --- List Command ---
program
  .command('list')
  .description('List available RulePacks and rules')
  .option('--rulepack <path>', 'List rules from specific RulePack')
  .option('--category <category>', 'Filter by category')
  .option('--severity <severity>', 'Filter by severity')
  .option('--enabled-only', 'Show only enabled rules')
  .action(async (options: ScanOptions): Promise<void> => {
    await executeListCommand(options);
  });

// --- Create Command ---
program
  .command('create <name>')
  .description('Create a new RulePack with templates')
  .option(
    '--template <template>',
    'Template to use (basic, pii, bias, security, compliance)'
  )
  .option('--description <description>', 'Description for the RulePack')
  .option('--category <category>', 'Category for the RulePack')
  .option('--force', 'Overwrite existing RulePack')
  .action(async (name: string, options: CreateOptions): Promise<void> => {
    await executeCreateCommand(name, options);
  });

// --- Test Command ---
program
  .command('test <input>')
  .description('Test text against RulePack rules')
  .option(
    '--rulepack <path>',
    'Path to RulePack YAML (default: rulepacks/pii.yaml)'
  )
  .option('--rule <id>', 'Test specific rule ID only')
  .option('--file', 'Treat input as file path instead of text')
  .option('--output <format>', 'Output format: text or json (default: text)')
  .option('--category <category>', 'Filter by category')
  .option('--severity <severity>', 'Filter by severity')
  .option('--verbose', 'Show detailed match information')
  .option('--quiet', 'Suppress headers and summary')
  .option('--debug', 'Enable debug mode with position information')
  .action(async (input: string, options: TestOptions): Promise<void> => {
    await executeTestCommand(input, options);
  });

// --- Init Command ---
program
  .command('init <filename>')
  .description('Initialize a new RulePack YAML file')
  .option(
    '--template <template>',
    'Template to use (basic, pii, bias, security, compliance) - default: basic'
  )
  .option('--description <description>', 'Description for the RulePack')
  .option('--category <category>', 'Category for the RulePack')
  .option('--force', 'Overwrite existing file')
  .option('--verbose', 'Show detailed information about generated rules')
  .option('--quiet', 'Suppress output messages')
  .action(async (filename: string, options: InitOptions): Promise<void> => {
    await executeInitCommand(filename, options);
  });

program.parse();
*/

// NEW CLI - USING THE NEW ARCHITECTURE
import './index-new-temp';
