/**
 * Core scanning engine for PromptShield
 * Handles file reading, rule application, and result generation
 *
 * OLD CODE - COMMENTED OUT FOR NEW ARCHITECTURE
 */
/*

import * as fs from 'fs';
import * as readline from 'readline';
import { ScanResult, Violation, createViolation } from '../types/core/rule';
import { Rule } from '../types/core/rule';
import { ScanConfig } from '../types/core/scanConfig';
import { scanFileWithRules } from './scanners/fileScanner';
import { scanStringWithRules } from './scanners/stringScanner';
import { JsonProcessor } from './json/processor';
import { isDirectory, findDataFiles } from '../processing/fileUtils';
import { loadAndValidateRulePack } from './rules';
import { logger } from '../utils/logger';

/**
 * Determines if a file should be treated as NDJSON (newline-delimited JSON)
 * @param filePath - The path to the file to check
 * @param ndjsonFlag - Optional flag to force NDJSON mode regardless of extension
 * @returns True if the file should be processed as NDJSON
 */
function isNdjsonFile(filePath: string, ndjsonFlag?: boolean): boolean {
  return (
    ndjsonFlag || filePath.endsWith('.ndjson') || filePath.endsWith('.jsonl')
  );
}

/**
 * Scans an NDJSON file line by line for rule violations
 *
 * NDJSON files contain one JSON object per line, making them suitable for
 * streaming large datasets. This function processes each line individually
 * and applies rules to each JSON object.
 *
 * @param filePath - Path to the NDJSON file to scan
 * @param rules - Array of rules to apply to each object
 * @param debug - Enable debug logging for performance monitoring
 * @param config - Scan configuration options (maxObjects, etc.)
 * @returns Promise resolving to a ScanResult with violations and timing info
 */
async function scanNdjsonFile(
  filePath: string,
  rules: Rule[],
  debug: boolean = false,
  config: ScanConfig = {}
): Promise<ScanResult> {
  const start: number = Date.now();
  const violations: Violation[] = [];
  let objectIndex = 0;
  let processed = 0;
  const maxObjects = config.maxObjects || Infinity;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (processed >= maxObjects) break;
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      const objectViolations = JsonProcessor.scanObject(obj, rules, {
        fieldsToScan: config.fieldsToScan,
        scanEntireObject: config.scanEntireObject,
        maxDepth: config.maxDepth
      }).map(violation => ({
        ...violation,
        objectIndex,
        filePath
      }));
      violations.push(...objectViolations);
    } catch {
      violations.push(
        createViolation({
          ruleId: 'ndjson-parse-error',
          message: 'Malformed NDJSON line',
          match: trimmed.slice(0, 100),
          severity: 'high',
          category: 'parse',
          filePath,
          objectIndex,
          field: undefined,
          lineNumber: undefined,
        })
      );
    }
    objectIndex++;
    processed++;
    if (debug && processed % 1000 === 0) {
      logger.debug(`[debug] Processed ${processed} NDJSON objects`);
    }
  }
  const durationMs = Date.now() - start;
  if (debug) {
    logger.debug(`[debug] Scanned NDJSON file ${filePath} in ${durationMs}ms`);
    logger.debug(`[debug] Processed ${processed} objects`);
    logger.debug(`[debug] Found ${violations.length} violations`);
  }
  return { file: filePath, violations, durationMs };
}

/**
 * Processes a batch of files in parallel using worker pool
 * @param files - Array of file paths to process
 * @param rules - Rules to apply to each file
 * @param debug - Enable debug logging
 * @param config - Scan configuration options
 * @param batchSize - Number of files to process in parallel
 * @returns Promise resolving to array of ScanResult objects
 */
async function processFilesInParallel(
  files: string[],
  rules: Rule[],
  debug: boolean,
  config: ScanConfig,
  batchSize: number = 10
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  // Process files in batches to avoid overwhelming the system
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    if (debug) {
      logger.debug(
        `[debug] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`
      );
    }

    const batchPromises = batch.map(async (file) => {
      try {
        if (isNdjsonFile(file, config.ndjsonMode)) {
          return await scanNdjsonFile(file, rules, debug, config);
        } else {
          return await scanFileWithRules(file, rules, debug, config);
        }
      } catch (error) {
        logger.error(`Error processing file ${file}: ${error}`);
        return {
          file,
          violations: [
            createViolation({
              ruleId: 'file-processing-error',
              message: `Error processing file: ${error}`,
              match: file,
              severity: 'high',
              category: 'parse',
              filePath: file,
              objectIndex: 0,
              field: undefined,
              lineNumber: undefined,
            }),
          ],
          durationMs: 0,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (debug) {
      const totalViolations = batchResults.reduce(
        (sum, result) => sum + result.violations.length,
        0
      );
      logger.debug(
        `[debug] Batch completed: ${totalViolations} violations found`
      );
    }
  }

  return results;
}

/**
 * Main scanning function that orchestrates the entire scanning process
 *
 * This function is the primary entry point for scanning operations. It handles:
 * - Loading and validating RulePacks
 * - Determining file type and processing strategy
 * - Coordinating between different scanning modes (data, directory, single file)
 * - Managing debug output and performance monitoring
 *
 * @param filePathOrData - File path to scan or raw data string (when isData=true)
 * @param rulePackPath - Path to the YAML RulePack file to use for scanning
 * @param isData - If true, treats filePathOrData as raw data string instead of file path
 * @param debug - Enable detailed debug logging and performance metrics
 * @param config - Scan configuration options (fields, maxObjects, etc.)
 * @returns Promise resolving to an array of ScanResult objects (one per file processed)
 *
 * @example
 * ```typescript
 * // Scan a single JSON file
 * const results = await applyRulesToDataOrStream(
 *   'data/prompts.json',
 *   'rulepacks/pii.yaml',
 *   false,
 *   true, // debug mode
 *   { fieldsToScan: ['prompt', 'response'] }
 * );
 *
 * // Scan raw data string
 * const results = await applyRulesToDataOrStream(
 *   '{"prompt": "Hello world", "response": "Hi there"}',
 *   'rulepacks/pii.yaml',
 *   true, // isData mode
 *   false
 * );
 * ```
 */
async function applyRulesToDataOrStream(
  filePathOrData: string,
  rulePackPath: string,
  isData: boolean = false,
  debug: boolean = false,
  config: ScanConfig = {}
): Promise<ScanResult[]> {
  const startTotal: number = Date.now();
  const rules: Rule[] = await loadAndValidateRulePack(rulePackPath);

  // In test mode, wrap the violations in a ScanResult with a dummy file name (e.g., file: 'test-input').
  if (isData) {
    const startParse: number = Date.now();
    const data: string = filePathOrData;

    // Check for empty content
    if (!data || data.trim().length === 0) {
      // Return empty violations for empty content
      return [
        {
          file: 'test-input',
          violations: [],
          durationMs: Date.now() - startTotal,
        },
      ];
    }

    // Check for malformed JSON (both test mode and CLI mode)
    if (config.ndjsonMode) {
      // NDJSON mode - check each line
      const lines = data.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        try {
          JSON.parse(line.trim());
        } catch {
          throw new Error('Invalid JSON');
        }
      }
    } else {
      // Regular JSON mode - check if it's valid JSON
      try {
        JSON.parse(data);
      } catch {
        throw new Error('Invalid JSON');
      }
    }

    const parseDuration: number = Date.now() - startParse;
    if (debug) logger.debug(`[debug] Parse phase: ${parseDuration}ms`);
    const violations: Violation[] = scanStringWithRules(
      data,
      rules,
      'test-input'
    );
    const scanDuration: number = Date.now() - startParse;
    if (debug) logger.debug(`[debug] Scan phase: ${scanDuration}ms`);
    const totalDuration: number = Date.now() - startTotal;
    if (debug) logger.debug(`[debug] Total scan: ${totalDuration}ms`);
    return [{ file: 'test-input', violations, durationMs: totalDuration }];
  }

  // Batch directory support
  if (await isDirectory(filePathOrData)) {
    const files: string[] = findDataFiles(filePathOrData);
    if (debug)
      logger.debug(
        `[debug] Found ${files.length} files in directory ${filePathOrData}`
      );

    let results: ScanResult[];

    // Use parallel processing if enabled
    if (config.parallel) {
      const batchSize = config.batchSize || 10;
      if (debug) {
        logger.debug(
          `[debug] Using parallel processing with batch size ${batchSize}`
        );
      }
      results = await processFilesInParallel(
        files,
        rules,
        debug,
        config,
        batchSize
      );
    } else {
      // Sequential processing (original behavior)
      const sequentialResults: ScanResult[][] = await Promise.all(
        files.map((file) =>
          applyRulesToDataOrStream(file, rulePackPath, false, debug, config)
        )
      );
      results = sequentialResults.flat();
    }

    const totalDuration: number = Date.now() - startTotal;
    if (debug) logger.debug(`[debug] Batch scan total: ${totalDuration}ms`);
    return results;
  } else {
    // NDJSON support
    if (isNdjsonFile(filePathOrData, config.ndjsonMode)) {
      const result = await scanNdjsonFile(filePathOrData, rules, debug, config);
      return [result];
    }
    // Single file (JSON or text)
    const result: ScanResult = await scanFileWithRules(
      filePathOrData,
      rules,
      debug,
      config
    );
    return [result];
  }
}

export { applyRulesToDataOrStream };
// */
