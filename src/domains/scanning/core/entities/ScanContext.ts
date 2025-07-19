import { ScanConfig } from '../../../../shared/types/ScanConfig';
import { RulePack } from '../../../rules/core/entities/RulePack';

/**
 * Represents the context for a scan operation
 */
export class ScanContext {
  constructor(
    public readonly config: ScanConfig,
    public readonly rulePack: RulePack,
    public readonly startTime: Date = new Date()
  ) {}

  /**
   * Gets the fields that should be scanned
   */
  getFieldsToScan(): string[] {
    return this.config.fields && this.config.fields.length > 0
      ? this.config.fields
      : ['prompt', 'response'];
  }

  /**
   * Checks if entire object should be scanned
   */
  shouldScanEntireObject(): boolean {
    return this.config.scanEntireObject || false;
  }

  /**
   * Gets the maximum depth for object traversal
   */
  getMaxDepth(): number {
    return this.config.maxDepth || 4;
  }

  /**
   * Gets the maximum number of objects to process
   */
  getMaxObjects(): number | undefined {
    return this.config.maxObjects;
  }

  /**
   * Checks if NDJSON mode is enabled
   */
  isNdjsonMode(): boolean {
    return this.config.ndjsonMode || false;
  }

  /**
   * Gets the streaming threshold
   */
  getStreamingThreshold(): number {
    return this.config.streamingThreshold || 1000;
  }

  /**
   * Checks if parallel processing is enabled
   */
  isParallelProcessing(): boolean {
    return this.config.parallel !== false;
  }

  /**
   * Gets the batch size for parallel processing
   */
  getBatchSize(): number {
    return this.config.batchSize || 10;
  }

  /**
   * Gets the processing timeout
   */
  getTimeout(): number {
    return this.config.timeout || 300;
  }

  /**
   * Gets elapsed time since scan started
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime.getTime();
  }
}
