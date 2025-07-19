import {
  ScanEngine,
  ScanOrchestrator as IScanOrchestrator,
  ScanStrategy,
  ScanMetricsCollector,
} from '../ports/ScanEngine';
import { FileReader } from '../ports/FileReader';
import { ContentProcessor, ProcessedContent } from '../ports/ContentProcessor';
import { Result, ok, err } from '../../../../shared/types/Result';
import { ScanRequest } from '../entities/ScanRequest';
import { ScanResult } from '../entities/ScanResult';
import { ScanContext } from '../entities/ScanContext';
import { RuleEngine } from '../../../rules/core/ports/RuleEngine';
import { Violation } from '../../../../shared/types/Violation';
import { ScanMetrics } from '../../../../shared/types/ScanMetrics';

/**
 * Main orchestrator for scan operations
 */
export class DefaultScanOrchestrator implements IScanOrchestrator, ScanEngine {
  constructor(
    private fileReader: FileReader,
    private processors: Map<string, ContentProcessor>,
    private ruleEngine: RuleEngine,
    private strategy: ScanStrategy,
    private metricsCollector: ScanMetricsCollector
  ) {}

  /**
   * Executes a scan request
   */
  async scan(request: ScanRequest): Promise<Result<ScanResult, Error>> {
    // Validate request
    const validationResult = this.validateRequest(request);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    // Create context
    const contextResult = await this.createContext(request);
    if (contextResult.isErr()) {
      return err(contextResult.error);
    }

    // Execute scan
    const scanResult = await this.orchestrate(
      contextResult.value,
      request.input
    );
    return scanResult;
  }

  /**
   * Validates a scan request
   */
  validateRequest(request: ScanRequest): Result<void, Error> {
    if (!request.input || request.input.trim() === '') {
      return err(new Error('Input is required'));
    }

    if (!request.config) {
      return err(new Error('Configuration is required'));
    }

    return ok(undefined);
  }

  /**
   * Creates a scan context from a request
   */
  async createContext(
    request: ScanRequest
  ): Promise<Result<ScanContext, Error>> {
    try {
      // Load rulepack
      const rulePackResult = await this.ruleEngine.loadRulePack(
        request.config.rulepack
      );
      if (rulePackResult.isErr()) {
        return err(rulePackResult.error);
      }

      const context = new ScanContext(request.config, rulePackResult.value);

      return ok(context);
    } catch (error) {
      return err(new Error(`Failed to create scan context: ${error}`));
    }
  }

  /**
   * Orchestrates the entire scan process
   */
  async orchestrate(
    context: ScanContext,
    input: string
  ): Promise<Result<ScanResult, Error>> {
    this.metricsCollector.start();

    try {
      // Check if input is a file or directory
      const isFile = await this.fileReader.exists(input);
      const isDir = await this.fileReader.isDirectory(input);

      if (isDir) {
        return this.scanDirectory(context, input);
      } else if (isFile) {
        return this.scanFile(context, input);
      } else {
        // Treat as direct content
        return this.scanContent(context, input, 'direct');
      }
    } catch (error) {
      return err(new Error(`Scan orchestration failed: ${error}`));
    }
  }

  /**
   * Scans a directory
   */
  private async scanDirectory(
    context: ScanContext,
    dirPath: string
  ): Promise<Result<ScanResult, Error>> {
    const filesResult = await this.fileReader.listFiles(dirPath);
    if (filesResult.isErr()) {
      return err(filesResult.error);
    }

    const allViolations: Violation[] = [];
    let totalObjects = 0;

    for (const filePath of filesResult.value) {
      const fileResult = await this.scanFile(context, filePath);
      if (fileResult.isOk()) {
        allViolations.push(...fileResult.value.violations);
        totalObjects += fileResult.value.metrics.objectsScanned;
      }
    }

    const baseMetrics = this.metricsCollector.end();
    const metrics: ScanMetrics = {
      ...baseMetrics,
      objectsScanned: totalObjects,
      streamingUsed: false,
    };

    return ok(new ScanResult(allViolations, metrics));
  }

  /**
   * Scans a single file
   */
  private async scanFile(
    context: ScanContext,
    filePath: string
  ): Promise<Result<ScanResult, Error>> {
    // Read file content
    const contentResult = await this.fileReader.readFile(filePath);
    if (contentResult.isErr()) {
      return err(contentResult.error);
    }

    // Get file size for streaming decision
    const sizeResult = await this.fileReader.getFileSize(filePath);
    const fileSize = sizeResult.isOk() ? sizeResult.value : 0;

    // Find appropriate processor
    const processor = this.findProcessor(filePath);
    if (!processor) {
      return err(new Error(`No processor found for file: ${filePath}`));
    }

    // Determine if streaming should be used
    const useStreaming = this.strategy.shouldUseStreaming(
      fileSize,
      context.getStreamingThreshold()
    );

    if (useStreaming && 'processStream' in processor) {
      return this.scanWithStreaming(
        context,
        contentResult.value,
        processor as ContentProcessor & {
          processStream: (
            content: string,
            context: ScanContext,
            callback: (item: ProcessedContent) => Promise<void>
          ) => Promise<Result<void, Error>>;
        }
      );
    } else {
      return this.scanContent(context, contentResult.value, filePath);
    }
  }

  /**
   * Scans content directly
   */
  private async scanContent(
    context: ScanContext,
    content: string,
    source: string
  ): Promise<Result<ScanResult, Error>> {
    // Find appropriate processor based on source
    const processor = this.findProcessor(source) || this.processors.get('text');
    if (!processor) {
      return err(new Error(`No processor found for content`));
    }

    // Process content
    const processedResult = await processor.process(content, context);
    if (processedResult.isErr()) {
      return err(processedResult.error);
    }

    // Apply rules to processed content
    const violations: Violation[] = [];
    const enabledRules = context.rulePack.getEnabledRules();

    for (const item of processedResult.value) {
      const itemViolations = await this.ruleEngine.applyRules(
        item.fields,
        enabledRules,
        item.metadata
      );

      if (itemViolations.isOk()) {
        violations.push(...itemViolations.value);
      }
    }

    // Collect metrics
    const baseMetrics = this.metricsCollector.end();
    const metrics: ScanMetrics = {
      ...baseMetrics,
      objectsScanned: processedResult.value.length,
      rulesApplied: enabledRules.length,
      streamingUsed: false,
    };

    return ok(new ScanResult(violations, metrics));
  }

  /**
   * Scans with streaming for large files
   */
  private async scanWithStreaming(
    context: ScanContext,
    content: string,
    processor: ContentProcessor & {
      processStream: (
        content: string,
        context: ScanContext,
        callback: (item: ProcessedContent) => Promise<void>
      ) => Promise<Result<void, Error>>;
    }
  ): Promise<Result<ScanResult, Error>> {
    const violations: Violation[] = [];
    const enabledRules = context.rulePack.getEnabledRules();
    let itemCount = 0;

    const result = await processor.processStream(
      content,
      context,
      async (item: ProcessedContent) => {
        const itemViolations = await this.ruleEngine.applyRules(
          item.fields,
          enabledRules,
          item.metadata
        );

        if (itemViolations.isOk()) {
          violations.push(...itemViolations.value);
        }

        itemCount++;
        this.metricsCollector.recordProcessing(
          itemCount,
          process.memoryUsage().heapUsed
        );
      }
    );

    if (result.isErr()) {
      return err(result.error);
    }

    const baseMetrics = this.metricsCollector.end();
    const metrics: ScanMetrics = {
      ...baseMetrics,
      objectsScanned: itemCount,
      rulesApplied: enabledRules.length,
      streamingUsed: true,
    };

    return ok(new ScanResult(violations, metrics));
  }

  /**
   * Finds appropriate processor for a file
   */
  private findProcessor(filePath: string): ContentProcessor | undefined {
    for (const [, processor] of this.processors) {
      if (processor.canProcess(filePath)) {
        return processor;
      }
    }
    return undefined;
  }
}
