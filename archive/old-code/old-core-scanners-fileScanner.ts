/**
 * File-based scanning logic for PromptShield
 *
 * This module handles scanning of individual files, supporting both JSON and
 * text file formats. It provides intelligent file type detection, batch processing
 * for large files, and comprehensive error handling for various file system issues.
 *
 * OLD CODE - COMMENTED OUT FOR NEW ARCHITECTURE
 */
/*

import {
  Rule,
  Violation,
  ScanResult,
  createViolation,
} from '../../types/core/rule';
import { readFileUtf8 } from '../../processing/fileUtils';
import { JsonProcessor } from '../json/processor';
import { ScanConfig, mergeScanConfig } from '../../types/core/scanConfig';
import { scanStringWithRules } from './stringScanner';
import { createReadStream } from 'fs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { isJsonObject } from '../../types/data/json';
import { logger } from '../../utils/logger';
import {
  memoryMonitor as globalMemoryMonitor,
  MemoryMonitor,
} from '../../utils/memoryMonitor';

/**
 * Configuration constants for streaming operations
 */
const DEBUG_PROGRESS_INTERVAL = 1000; // Log progress every N objects

/**
 * Streams a large JSON array file and applies rules to each object
 *
 * This function provides memory-efficient processing of large JSON arrays
 * by streaming the file content instead of loading it entirely into memory.
 * It includes comprehensive error handling and progress monitoring.
 *
 * @param filePath - Path to the JSON array file to stream
 * @param rules - Array of rules to apply to each object
 * @param debug - Enable debug output with performance metrics
 * @param config - Scan configuration options
 * @returns Promise resolving to a ScanResult with violations and timing information
 */
async function streamAndScanJsonArray(
  filePath: string,
  rules: Rule[],
  debug: boolean = false,
  config: ScanConfig = {}
): Promise<ScanResult> {
  if (!filePath)
    throw new Error('streamAndScanJsonArray: filePath is required');
  if (!rules) throw new Error('streamAndScanJsonArray: rules are required');

  // Use a custom memory monitor if a threshold is provided, else use global
  const memoryMonitor =
    config.memoryWarningThreshold !== undefined
      ? new MemoryMonitor({ warningThreshold: config.memoryWarningThreshold })
      : globalMemoryMonitor;

  return new Promise((resolve, reject) => {
    const violations: Violation[] = [];
    let objectIndex = 0;
    let processed = 0;
    const maxObjects = config.maxObjects || Infinity;
    const maxDepth = config.maxDepth ?? 4;
    const start = Date.now();

    let fileStream: (NodeJS.ReadableStream & { destroy?: () => void }) | null =
      null;
    let jsonPipeline:
      | (NodeJS.ReadableStream & { destroy?: () => void })
      | null = null;

    try {
      fileStream = createReadStream(filePath);
      jsonPipeline = fileStream.pipe(parser()).pipe(streamArray());

      if (!jsonPipeline) {
        throw new Error('Failed to create JSON pipeline');
      }

      jsonPipeline.on('data', ({ value }: { value: unknown }) => {
        if (processed >= maxObjects) {
          cleanupStreams();
          return;
        }

        try {
          // Only scan if value is a valid JsonObject
          if (isJsonObject(value)) {
            const objectViolations = JsonProcessor.scanObject(value, rules, {
              fieldsToScan: config.fieldsToScan,
              scanEntireObject: config.scanEntireObject,
              maxDepth,
            }).map((violation) => ({
              ...violation,
              objectIndex,
              filePath,
            }));
            violations.push(...objectViolations);
          } else {
            // Log non-object values but don't treat as error
            if (debug) {
              logger.debug(`Skipping non-object value at index ${objectIndex}`);
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          violations.push(
            createViolation({
              ruleId: 'json-parse-error',
              message: `Error processing JSON object: ${errorMessage}`,
              match: JSON.stringify(value).slice(0, 100),
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

        if (debug && processed % DEBUG_PROGRESS_INTERVAL === 0) {
          logger.debug(`Streamed ${processed} JSON objects`);
          memoryMonitor.checkMemoryUsage('JSON streaming');
        }
      });

      jsonPipeline.on('end', () => {
        const durationMs = Date.now() - start;
        if (debug) {
          logger.debug(`Streamed JSON file ${filePath} in ${durationMs}ms`);
          logger.debug(`Processed ${processed} objects`);
          logger.debug(`Found ${violations.length} violations`);
        }
        resolve({ file: filePath, violations, durationMs });
      });

      jsonPipeline.on('error', (error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown stream error';
        violations.push(
          createViolation({
            ruleId: 'stream-error',
            message: `Stream processing error: ${errorMessage}`,
            match: '',
            severity: 'high',
            category: 'internal',
            filePath,
            objectIndex,
            field: undefined,
            lineNumber: undefined,
          })
        );

        const durationMs = Date.now() - start;
        resolve({ file: filePath, violations, durationMs });
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      reject(
        new Error(
          `Failed to initialize stream for ${filePath}: ${errorMessage}`
        )
      );
    }

    function cleanupStreams(): void {
      if (jsonPipeline && typeof jsonPipeline.destroy === 'function') {
        jsonPipeline.destroy();
        jsonPipeline = null;
      }
      if (fileStream && typeof fileStream.destroy === 'function') {
        fileStream.destroy();
        fileStream = null;
      }
    }
  });
}

/**
 * Determines if a JSON array should use streaming based on size and configuration
 *
 * @param arrayLength - The length of the JSON array
 * @param config - Scan configuration options
 * @returns True if streaming should be used
 */
function shouldUseStreaming(arrayLength: number, config: ScanConfig): boolean {
  // Use streaming if explicitly configured or if array is large
  const streamingThreshold = config.streamingThreshold ?? 1000;
  return config.maxObjects !== undefined || arrayLength > streamingThreshold;
}

/**
 * Scans a file (JSON or text) for rule violations with comprehensive error handling
 *
 * This function is the main entry point for file-based scanning operations. It
 * automatically detects file type (JSON vs text), handles large files with batch
 * processing, and provides detailed debug output for performance monitoring.
 *
 * The function supports:
 * - JSON files with array of objects (processed individually with streaming for large files)
 * - Text files (processed as single string)
 * - Large file optimization with configurable batch sizes
 * - Comprehensive error handling for file system and parsing issues
 * - Debug mode with performance metrics and progress indicators
 *
 * @param filePath - Path to the file to scan
 * @param rules - Array of rules to apply to the file content
 * @param debug - Enable debug output with performance metrics and progress indicators
 * @param config - Scan configuration options (fields, maxObjects, schema, etc.)
 * @returns Promise resolving to a ScanResult with violations and timing information
 * @throws Various file system and parsing errors with detailed error messages
 *
 * @example
 * ```typescript
 * const rules = await loadAndValidateRulePack('rulepacks/pii.yaml');
 *
 * // Scan a JSON file
 * const result = await scanFileWithRules(
 *   'data/prompts.json',
 *   rules,
 *   true, // debug mode
 *   {
 *     fieldsToScan: ['prompt', 'response'],
 *     maxObjects: 1000
 *   }
 * );
 *
 * // Scan a text file
 * const result = await scanFileWithRules(
 *   'data/sample.txt',
 *   rules,
 *   false
 * );
 *
 * console.log(`Found ${result.violations.length} violations in ${result.durationMs}ms`);
 * ```
 */
export async function scanFileWithRules(
  filePath: string,
  rules: Rule[],
  debug: boolean = false,
  config: ScanConfig = {}
): Promise<ScanResult> {
  if (!filePath) throw new Error('scanFileWithRules: filePath is required');
  if (!rules) throw new Error('scanFileWithRules: rules are required');
  const start = Date.now();
  const mergedConfig = mergeScanConfig(config);

  // Use a custom memory monitor if a threshold is provided, else use global
  const memoryMonitor =
    mergedConfig.memoryWarningThreshold !== undefined
      ? new MemoryMonitor({
          warningThreshold: mergedConfig.memoryWarningThreshold,
        })
      : globalMemoryMonitor;

  // Read file content
  const content = await readFileUtf8(filePath);

  // Check for empty content
  if (!content || content.trim().length === 0) {
    // Return empty violations for empty files
    const durationMs = Date.now() - start;
    return {
      file: filePath,
      violations: [],
      durationMs,
    };
  }

  // Check if content is JSON-like
  if (JsonProcessor.isJsonLike(content)) {
    const result = JsonProcessor.parse(content);
    if (result.error) {
      // For test mode, throw the error instead of creating a violation
      if (
        result.error.includes('Invalid JSON') ||
        result.error.includes('File is empty')
      ) {
        throw new Error(result.error);
      }
      const durationMs = Date.now() - start;
      return {
        file: filePath,
        violations: [
          createViolation({
            ruleId: 'json-parse-error',
            message: result.error,
            match: '',
            severity: 'high',
            category: 'parse',
            filePath,
            objectIndex: 0,
            field: undefined,
            lineNumber: result.line,
          }),
        ],
        durationMs,
      };
    }

    const parsed = result.data;

    if (Array.isArray(parsed)) {
      // Determine if we should use streaming based on array size and config
      if (shouldUseStreaming(parsed.length, mergedConfig)) {
        return await streamAndScanJsonArray(
          filePath,
          rules,
          debug,
          mergedConfig
        );
      }

      // Small array - process in memory
      const violations: Violation[] = [];
      const maxObjects = mergedConfig.maxObjects || Infinity;
      const maxDepth = mergedConfig.maxDepth ?? 4;

      for (let i = 0; i < Math.min(parsed.length, maxObjects); i++) {
        const objectViolations = JsonProcessor.scanObject(parsed[i], rules, {
          fieldsToScan: mergedConfig.fieldsToScan,
          scanEntireObject: mergedConfig.scanEntireObject,
          maxDepth,
        }).map((violation) => ({
          ...violation,
          objectIndex: i,
          filePath,
        }));
        violations.push(...objectViolations);
        // Granular memory check after each batch
        if (debug && i > 0 && i % DEBUG_PROGRESS_INTERVAL === 0) {
          memoryMonitor.checkMemoryUsage('JSON in-memory scan');
        }
      }

      const durationMs = Date.now() - start;
      if (debug) {
        logger.debug(`Scanned JSON array file ${filePath} in ${durationMs}ms`);
        logger.debug(
          `Processed ${Math.min(parsed.length, maxObjects)} objects`
        );
        logger.debug(`Found ${violations.length} violations`);
      }

      return { file: filePath, violations, durationMs };
    } else {
      // Single JSON object
      const violations = JsonProcessor.scanObject(parsed, rules, {
        fieldsToScan: mergedConfig.fieldsToScan,
        scanEntireObject: mergedConfig.scanEntireObject,
        maxDepth: mergedConfig.maxDepth,
      }).map((violation) => ({
        ...violation,
        objectIndex: 0,
        filePath,
      }));

      const durationMs = Date.now() - start;
      if (debug) {
        logger.debug(`Scanned JSON object file ${filePath} in ${durationMs}ms`);
        logger.debug(`Found ${violations.length} violations`);
      }

      return { file: filePath, violations, durationMs };
    }
  } else {
    // Text file - scan as string
    const violations = scanStringWithRules(content, rules, filePath);

    const durationMs = Date.now() - start;
    if (debug) {
      logger.debug(`Scanned text file ${filePath} in ${durationMs}ms`);
      logger.debug(`Found ${violations.length} violations`);
    }

    return { file: filePath, violations, durationMs };
  }
}
// */
