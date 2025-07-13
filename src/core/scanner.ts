/**
 * Core scanning functionality for PromptShield
 */

import * as fs from 'fs';
import readline from 'readline';
import { loadAndValidateRulePack } from './rules';
import { Rule, Violation, ScanResult } from '../types/core/rule';
import { isDirectory, findDataFiles } from '../services/fileUtils';
import {
  scanFileWithRules,
  scanStringWithRules,
  scanJsonObjectWithRules,
} from './ruleEngine';
import { ScanConfig } from '../types/core/scanConfig';

function isNdjsonFile(filePath: string, ndjsonFlag?: boolean): boolean {
  return (
    ndjsonFlag || filePath.endsWith('.ndjson') || filePath.endsWith('.jsonl')
  );
}

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
      const objectViolations = scanJsonObjectWithRules(
        obj,
        objectIndex,
        rules,
        filePath,
        config
      );
      violations.push(...objectViolations);
    } catch {
      violations.push({
        ruleId: 'ndjson-parse-error',
        message: 'Malformed NDJSON line',
        match: trimmed.slice(0, 100),
        severity: 'high',
        category: 'parse',
        filePath,
        objectIndex,
        field: undefined,
      });
    }
    objectIndex++;
    processed++;
    if (debug && processed % 1000 === 0) {
      console.log(`[debug] Processed ${processed} NDJSON objects`);
    }
  }
  const durationMs = Date.now() - start;
  if (debug) {
    console.log(`[debug] Scanned NDJSON file ${filePath} in ${durationMs}ms`);
    console.log(`[debug] Processed ${processed} objects`);
    console.log(`[debug] Found ${violations.length} violations`);
  }
  return { file: filePath, violations, durationMs };
}

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
    const parseDuration: number = Date.now() - startParse;
    if (debug) console.log(`[debug] Parse phase: ${parseDuration}ms`);
    const violations: Violation[] = scanStringWithRules(
      data,
      rules,
      'test-input'
    );
    const scanDuration: number = Date.now() - startParse;
    if (debug) console.log(`[debug] Scan phase: ${scanDuration}ms`);
    const totalDuration: number = Date.now() - startTotal;
    if (debug) console.log(`[debug] Total scan: ${totalDuration}ms`);
    return [{ file: 'test-input', violations, durationMs: totalDuration }];
  }

  // Batch directory support
  if (await isDirectory(filePathOrData)) {
    const files: string[] = findDataFiles(filePathOrData);
    if (debug)
      console.log(
        `[debug] Found ${files.length} files in directory ${filePathOrData}`
      );
    const results: ScanResult[][] = await Promise.all(
      files.map((file) =>
        applyRulesToDataOrStream(file, rulePackPath, false, debug, config)
      )
    );
    const totalDuration: number = Date.now() - startTotal;
    if (debug) console.log(`[debug] Batch scan total: ${totalDuration}ms`);
    return results.flat();
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
