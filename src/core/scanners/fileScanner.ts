/**
 * File-based scanning logic for PromptShield
 */

import { Rule, Violation, ScanResult } from '../../types/core/rule';
import { readFileUtf8 } from '../../services/fileUtils';
import { parseJsonSafe, isJsonLike } from '../../services/jsonParser';
import { ScanConfig } from '../../types/core/scanConfig';
import { JsonObject } from '../../types/data/json';
import {
  createInvalidJsonError,
  createInvalidJsonStructureError,
  createEmptyFileError,
  handleFileSystemError,
} from '../../utils/errors';
import { scanJsonObjectWithRules } from './jsonScanner';
import { scanStringWithRules } from './stringScanner';

/**
 * Scans a file (JSON or text) for rule violations
 * @param filePath - Path to the file
 * @param rules - Array of rules to apply
 * @param debug - Enable debug output
 * @param config - Scan configuration
 * @returns ScanResult object
 */
export async function scanFileWithRules(
  filePath: string,
  rules: Rule[],
  debug: boolean = false,
  config: ScanConfig = {}
): Promise<ScanResult> {
  const start: number = Date.now();

  try {
    const data: string = await readFileUtf8(filePath);

    // Check if this is a JSON file and handle accordingly
    const isJson = filePath.endsWith('.json') || isJsonLike(data);

    if (isJson) {
      const jsonResult = parseJsonSafe(data, filePath, config.schemaName);
      if (jsonResult.error) {
        // Convert JSON parser errors to proper error types
        if (jsonResult.error.includes('File is empty')) {
          throw createEmptyFileError(filePath);
        } else if (jsonResult.error.includes('Invalid JSON structure')) {
          throw createInvalidJsonStructureError(filePath, jsonResult.error);
        } else {
          throw createInvalidJsonError(
            filePath,
            jsonResult.error,
            jsonResult.lineNumber
          );
        }
      }

      // Scan each JSON object individually with configurable fields
      const violations: Violation[] = [];
      const maxObjects = config.maxObjects || jsonResult.data.length;
      const totalObjects = Math.min(jsonResult.data.length, maxObjects);

      // Process objects in batches for large files
      const batchSize = 1000;
      for (let i = 0; i < totalObjects; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, totalObjects);

        // Process batch
        for (let j = i; j < batchEnd; j++) {
          const objectViolations = scanJsonObjectWithRules(
            jsonResult.data[j] as JsonObject,
            j,
            rules,
            filePath,
            config
          );
          violations.push(...objectViolations);
        }

        // Progress indicator for large files
        if (debug && totalObjects > batchSize) {
          console.log(`[debug] Processed ${batchEnd}/${totalObjects} objects`);
        }
      }

      const durationMs: number = Date.now() - start;
      if (debug) {
        console.log(`[debug] Scanned JSON file ${filePath} in ${durationMs}ms`);
        console.log(`[debug] Processed ${totalObjects} objects`);
        console.log(`[debug] Found ${violations.length} violations`);
        console.log(
          `[debug] Performance: ${Math.round(totalObjects / (durationMs / 1000))} objects/sec`
        );
      }
      return { file: filePath, violations, durationMs };
    } else {
      // Handle as regular text file
      const violations: Violation[] = scanStringWithRules(
        data,
        rules,
        filePath
      );
      const durationMs: number = Date.now() - start;
      if (debug)
        console.log(`[debug] Scanned text file ${filePath} in ${durationMs}ms`);
      return { file: filePath, violations, durationMs };
    }
  } catch (error) {
    // Handle file system errors
    if (error instanceof Error && 'code' in error) {
      throw handleFileSystemError(error as NodeJS.ErrnoException, filePath);
    }
    // Re-throw PromptShield errors as-is
    if (error instanceof Error && error.name === 'PromptShieldError') {
      throw error;
    }
    // Handle other errors
    throw error;
  }
}
