import { ScanCommand } from './ScanCommand';
import { ScanEngine } from '../../../domains/scanning/core/ports/ScanEngine';
import { ReportService } from '../../../domains/reporting/core/ports/Renderer';
import { Logger } from '../../../infrastructure/logging/Logger';
import { Result, ok, err } from '../../../shared/types/Result';
import { ScanRequest } from '../../../domains/scanning/core/entities/ScanRequest';
import { Report } from '../../../domains/reporting/core/entities/Report';
import { ValidationError } from '../../../infrastructure/errors/DomainError';

/**
 * Handles scan command execution
 */
export class ScanCommandHandler {
  constructor(
    private scanEngine: ScanEngine,
    private reportService: ReportService,
    private logger: Logger
  ) {}

  /**
   * Executes the scan command
   */
  async execute(command: ScanCommand): Promise<Result<void, Error>> {
    try {
      this.logger.info('Starting scan', { input: command.input });

      // Create scan request
      const scanConfig = command.toScanConfig();
      const scanRequest = ScanRequest.create(command.input, scanConfig);

      // Execute scan
      const scanResult = await this.scanEngine.scan(scanRequest);
      if (scanResult.isErr()) {
        this.logger.error('Scan failed', scanResult.error);
        return err(scanResult.error);
      }

      this.logger.info('Scan completed', {
        violations: scanResult.value.getTotalViolations(),
        duration: scanResult.value.metrics.processingTime,
      });

      // Create report
      const report = new Report(scanResult.value, scanConfig.outputFormat, {
        severity: scanConfig.severity,
        category: scanConfig.category,
        maxViolations: scanConfig.maxViolations,
        offset: scanConfig.offset,
        limit: scanConfig.limit,
        includeSummary: !scanConfig.quiet,
        includeMetrics: !scanConfig.quiet,
        verbose: scanConfig.verbose,
        quiet: scanConfig.quiet,
        noColor: scanConfig.noColor,
        outputFile: scanConfig.outputFile,
        compress: scanConfig.compress,
        compressionLevel: scanConfig.compressionLevel,
      });

      // Generate and output report
      if (scanConfig.outputFile) {
        const writeResult = await this.reportService.writeReport(
          report,
          scanConfig.outputFile
        );
        if (writeResult.isErr()) {
          this.logger.error('Failed to write report', writeResult.error);
          return err(writeResult.error);
        }

        if (!scanConfig.quiet) {
          console.log(`Report written to: ${scanConfig.outputFile}`);
        }
      } else {
        const renderResult = await this.reportService.generateReport(report);
        if (renderResult.isErr()) {
          this.logger.error('Failed to generate report', renderResult.error);
          return err(renderResult.error);
        }

        // Output to console
        console.log(renderResult.value);
      }

      // Check if should fail based on severity
      if (scanConfig.failOn && scanResult.value.shouldFail(scanConfig.failOn)) {
        const message = `Found violations with severity: ${scanConfig.failOn}`;
        this.logger.warn(message);

        if (scanConfig.strict) {
          return err(new Error(message));
        }
      }

      return ok(undefined);
    } catch (error) {
      this.logger.error('Unexpected error in scan command', error as Error);
      return err(error as Error);
    }
  }

  /**
   * Validates command before execution
   */
  validateCommand(command: ScanCommand): Result<void, Error> {
    const errors: string[] = [];

    if (!command.input || command.input.trim() === '') {
      errors.push('Input is required');
    }

    const validFormats = ['json', 'markdown', 'csv', 'table', 'html', 'ndjson'];
    if (
      command.options.output &&
      !validFormats.includes(command.options.output)
    ) {
      errors.push(`Invalid output format: ${command.options.output}`);
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (
      command.options.failOn &&
      !validSeverities.includes(command.options.failOn)
    ) {
      errors.push(`Invalid fail-on severity: ${command.options.failOn}`);
    }

    if (command.options.compressionLevel !== undefined) {
      const level = command.options.compressionLevel;
      if (level < 0 || level > 9) {
        errors.push('Compression level must be between 0 and 9');
      }
    }

    if (errors.length > 0) {
      return err(
        new ValidationError(`Validation failed: ${errors.join(', ')}`, errors)
      );
    }

    return ok(undefined);
  }
}
