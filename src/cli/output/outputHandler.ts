/**
 * Comprehensive output handling for PromptShield CLI
 * Handles file writing, format validation, compression, and error recovery
 */

import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createDeflate } from 'zlib';

import {
  PromptShieldError,
  createOutputWriteFailedError,
  createInvalidOutputFormatError,
  handleOutputFileSystemError,
  ErrorType,
} from '../../utils/errors';
import { OutputFormat } from '../../types/core/outputFormat';
import { ScanResult } from '../../types/core/rule';
import { rendererRegistry } from '../../core/renderers';
import { MetadataBuilder } from '../../core/renderers/metadataBuilder';
import { logger } from '../../utils/logger';

export interface OutputOptions {
  format: OutputFormat;
  outputFile?: string;
  compress?: 'gzip' | 'deflate';
  compressionLevel?: number;
  noColor?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  rulepack?: string;
  filters?: {
    severity?: string[];
    category?: string[];
  };
  options?: {
    maxViolations?: number;
    offset?: number;
    limit?: number;
  };
}

export interface OutputResult {
  success: boolean;
  outputPath?: string;
  error?: PromptShieldError;
  warnings: string[];
}

/**
 * Output handler with comprehensive error handling
 */
export class OutputHandler {
  private options: OutputOptions;

  constructor(options: OutputOptions) {
    this.options = options;
  }

  /**
   * Validates output format
   */
  private validateFormat(format: OutputFormat): void {
    if (!rendererRegistry.isSupported(format)) {
      const availableFormats = rendererRegistry.getAvailableFormats();
      throw createInvalidOutputFormatError(format, availableFormats);
    }
  }

  /**
   * Ensures output directory exists
   */
  private async ensureOutputDirectory(outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (dir !== '.') {
      try {
        // Create directory if it doesn't exist
        await fs.promises.mkdir(dir, { recursive: true });

        // Verify directory was created successfully (race condition protection)
        const stats = await fs.promises.stat(dir);
        if (!stats.isDirectory()) {
          throw new Error(`Path exists but is not a directory: ${dir}`);
        }
      } catch (error) {
        const fsError = error as NodeJS.ErrnoException;
        // If directory already exists, that's fine
        if (fsError.code === 'EEXIST') {
          return;
        }
        throw handleOutputFileSystemError(fsError, dir);
      }
    }
  }

  /**
   * Ensures output directory exists and is accessible for streaming (with retry logic)
   */
  private async ensureOutputDirectoryForStreaming(
    outputPath: string
  ): Promise<void> {
    const dir = path.dirname(outputPath);
    if (dir !== '.') {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          // Create directory if it doesn't exist
          await fs.promises.mkdir(dir, { recursive: true });

          // Verify directory exists and is accessible
          await fs.promises.access(dir, fs.constants.F_OK | fs.constants.W_OK);

          // Double-check it's a directory
          const stats = await fs.promises.stat(dir);
          if (!stats.isDirectory()) {
            throw new Error(`Path exists but is not a directory: ${dir}`);
          }

          // Success - directory is ready
          return;
        } catch (error) {
          const fsError = error as NodeJS.ErrnoException;
          attempts++;

          // If directory already exists and is accessible, that's fine
          if (fsError.code === 'EEXIST') {
            try {
              await fs.promises.access(
                dir,
                fs.constants.F_OK | fs.constants.W_OK
              );
              return;
            } catch {
              // Fall through to retry
            }
          }

          // If this was the last attempt, throw the error
          if (attempts >= maxAttempts) {
            throw handleOutputFileSystemError(fsError, dir);
          }

          // Wait a bit before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 10 * attempts));
        }
      }
    }
  }

  /**
   * Validates output file path
   */
  private validateOutputPath(outputPath: string): void {
    // Check for invalid characters, but allow Windows drive letters
    const invalidChars = /[<>"|?*]/;
    if (invalidChars.test(outputPath)) {
      throw createOutputWriteFailedError(
        outputPath,
        new Error('Invalid characters in file path')
      );
    }

    // Check for reserved names (Windows)
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];
    const fileName = path
      .basename(outputPath, path.extname(outputPath))
      .toUpperCase();
    if (reservedNames.includes(fileName)) {
      throw createOutputWriteFailedError(
        outputPath,
        new Error('Reserved file name')
      );
    }
  }

  /**
   * Creates compression stream
   */
  private createCompressionStream(): NodeJS.ReadWriteStream {
    if (!this.options.compress) {
      throw new Error('No compression type specified');
    }

    const level = this.options.compressionLevel || 6;

    // Validate compression level (0-9 for gzip/deflate)
    if (level < 0 || level > 9) {
      throw new Error(
        `Invalid compression level: ${level}. Must be between 0 and 9.`
      );
    }

    switch (this.options.compress) {
      case 'gzip':
        return createGzip({ level });
      case 'deflate':
        return createDeflate({ level });
      default:
        throw new Error(
          `Unsupported compression type: ${this.options.compress}`
        );
    }
  }

  /**
   * Writes content to file with error handling
   */
  private async writeToFile(
    content: string,
    outputPath: string
  ): Promise<void> {
    try {
      // Validate output path
      this.validateOutputPath(outputPath);

      // Ensure directory exists
      await this.ensureOutputDirectory(outputPath);

      // Write content
      if (this.options.compress) {
        // Write with compression
        try {
          const compressionStream = this.createCompressionStream();
          const writeStream = createWriteStream(outputPath);

          // Create a readable stream from the content
          const { Readable } = await import('stream');
          const contentStream = Readable.from([content]);

          await pipeline(contentStream, compressionStream, writeStream);
        } catch (compressionError) {
          const errorMessage =
            compressionError instanceof Error
              ? compressionError.message
              : 'Compression failed';
          throw createOutputWriteFailedError(
            outputPath,
            new Error(errorMessage)
          );
        }
      } else {
        // Write without compression
        await fs.promises.writeFile(outputPath, content, 'utf8');
      }
    } catch (error) {
      if (error instanceof PromptShieldError) {
        throw error;
      }

      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code) {
        throw handleOutputFileSystemError(fsError, outputPath);
      } else {
        throw createOutputWriteFailedError(outputPath, error as Error);
      }
    }
  }

  /**
   * Formats and outputs scan results
   */
  async outputResults(results: ScanResult[]): Promise<OutputResult> {
    const warnings: string[] = [];

    try {
      // Validate format
      this.validateFormat(this.options.format);

      // Get renderer
      const renderer = rendererRegistry.getRenderer(this.options.format);

      // Build context with metadata
      const context = MetadataBuilder.buildContext(
        results,
        {
          rulepack: this.options.rulepack,
          filters: this.options.filters,
          options: this.options.options,
        },
        {
          noColor: this.options.noColor,
          verbose: this.options.verbose,
          quiet: this.options.quiet,
        }
      );

      // Streaming output for NDJSON if possible
      let outputPath: string | undefined;
      if (this.options.outputFile) {
        outputPath = this.options.outputFile;
        if (!path.extname(outputPath)) {
          outputPath += renderer.getExtension();
        }
      }

      if (
        outputPath &&
        renderer.supportsStreaming() &&
        typeof renderer.stream === 'function' &&
        (this.options.format === 'ndjson' ||
          this.options.format === 'markdown' ||
          this.options.format === 'csv')
      ) {
        // Ensure directory exists and is accessible before streaming
        await this.ensureOutputDirectoryForStreaming(outputPath);

        // Stream output for NDJSON, Markdown, or CSV
        const writable = createWriteStream(outputPath);
        await renderer.stream(results, context, writable);
        if (!this.options.quiet) {
          const successMessage = `Report saved to ${outputPath}`;
          logger.success(successMessage);
        }
        return {
          success: true,
          outputPath,
          warnings,
        };
      }

      // Fallback: buffered output
      const content = renderer.render(results, context);

      if (outputPath) {
        await this.writeToFile(content, outputPath);
        if (!this.options.quiet) {
          const successMessage = `Report saved to ${outputPath}`;
          logger.success(successMessage);
        }
        return {
          success: true,
          outputPath,
          warnings,
        };
      } else {
        // Output to stdout
        if (this.options.format === 'json') {
          // For JSON output, use console.log directly to avoid color formatting
          console.log(content);
        } else {
          // For other formats, use logger for consistent formatting
          logger.info(content);
        }
        return {
          success: true,
          warnings,
        };
      }
    } catch (error) {
      if (error instanceof PromptShieldError) {
        return {
          success: false,
          error,
          warnings,
        };
      }

      // Convert unknown errors
      const unknownError = error as Error;
      const promptShieldError = new PromptShieldError({
        type: ErrorType.UNKNOWN_ERROR,
        message: `Output failed: ${unknownError.message}`,
        exitCode: 1,
      });

      return {
        success: false,
        error: promptShieldError,
        warnings,
      };
    }
  }

  /**
   * Handles output errors with user-friendly messages
   */
  handleOutputError(error: PromptShieldError): void {
    logger.error(`Error: ${error.message}`);
    if (error.suggestion) {
      logger.warn(`Suggestion: ${error.suggestion}`);
    }
    if (error.details) {
      logger.error('Details:', error.details);
    }
  }
}
