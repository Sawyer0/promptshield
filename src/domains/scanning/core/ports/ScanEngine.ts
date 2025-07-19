import { Result } from '../../../../shared/types/Result';
import { ScanRequest } from '../entities/ScanRequest';
import { ScanResult } from '../entities/ScanResult';
import { ScanContext } from '../entities/ScanContext';

/**
 * Interface for the core scan engine
 */
export interface ScanEngine {
  /**
   * Executes a scan request
   */
  scan(request: ScanRequest): Promise<Result<ScanResult, Error>>;

  /**
   * Validates a scan request
   */
  validateRequest(request: ScanRequest): Result<void, Error>;

  /**
   * Creates a scan context from a request
   */
  createContext(request: ScanRequest): Promise<Result<ScanContext, Error>>;
}

/**
 * Interface for scan strategy
 */
export interface ScanStrategy {
  /**
   * Determines if streaming should be used
   */
  shouldUseStreaming(contentSize: number, threshold: number): boolean;

  /**
   * Determines if parallel processing should be used
   */
  shouldUseParallelProcessing(itemCount: number, context: ScanContext): boolean;

  /**
   * Gets the optimal batch size for processing
   */
  getOptimalBatchSize(itemCount: number, context: ScanContext): number;
}

/**
 * Interface for scan orchestrator
 */
export interface ScanOrchestrator {
  /**
   * Orchestrates the entire scan process
   */
  orchestrate(
    context: ScanContext,
    content: string
  ): Promise<Result<ScanResult, Error>>;
}

/**
 * Interface for scan metrics collection
 */
export interface ScanMetricsCollector {
  /**
   * Starts metrics collection
   */
  start(): void;

  /**
   * Records processing metrics
   */
  recordProcessing(itemsProcessed: number, memoryUsage: number): void;

  /**
   * Ends metrics collection and returns results
   */
  end(): {
    objectsScanned: number;
    processingTime: number;
    memoryUsage: number;
    rulesApplied: number;
    streamingUsed: boolean;
  };
}
